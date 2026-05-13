# Training App

A spaced-repetition learning platform where cards can be static or procedurally generated from JS template functions.

---

## Entities

### User
```
id, email, passwordHash
role: "user" | "admin"
settings: {
  dailyGoal: number,          // cards per day
  notificationsEnabled: bool,
  pushSubscription: JSON      // Web Push API subscription object
}
```

### Template
A JS function run in a VM sandbox that generates a card variant on each review session.

```
id
authorId                      // admin for global templates, userId for personal
name, description
code: string                  // sandboxed JS, e.g.:
                              // ({ a, b }) => ({
                              //   question: `What is ${a} + ${b}?`,
                              //   answer: a + b,
                              //   hint: "just add them",
                              //   explanation: `${a} + ${b} = ${a+b}`  // shown on wrong answer
                              // })
inputSchema: JSON             // describes random input generation:
                              // { a: { type: "int", min: 1, max: 100 },
                              //   b: { type: "int", min: 1, max: 100 } }
isGlobal: bool                // admin-created templates visible to all users
```

**Template return value** — can return any of:
- `question`: string shown to user
- `answer`: any value (compared to user input; toString'd for string match)
- `hint`: string shown on request
- `explanation`: string shown when user answers incorrectly
- `choices`: string[] for multiple-choice mode (optional)

**Sandbox**: Node.js `isolated-vm` package. No network, no fs, 50ms timeout, memory limit.

### Log
A named set of cards to study. Can be auto-generated from a template or built manually.

```
id
userId
templateId (nullable)        // if set, cards were generated from this template
name, description
isGlobal: bool               // admin-created, visible to all users
createdAt
```

**Auto-generation**: user specifies a count (e.g. 20 cards). The system calls `template(randomInputs)` N times, storing the inputs as the card's seed — the question/answer are re-generated fresh each review session from the same inputs, so the display can vary while the underlying problem stays consistent.

### Card
```
id, logId
// Static card (no template):
question: string
answer: string               // strict string match on submission

// Template-generated card:
templateId
seedInputs: JSON             // frozen random inputs used to reproduce this variant
                             // e.g. { a: 42, b: 7 }

// SM-2 state (per user — stored in CardProgress):
```

### CardProgress  *(one row per user per card)*
```
id, cardId, userId
interval: number             // days until next review (starts at 1)
easeFactor: number           // starts at 2.5, min 1.3
dueAt: Date
state: "new" | "learning" | "review" | "relearning"
```

### Submission
```
id, cardId, userId
userAnswer: string
isCorrect: bool
quality: 0 | 1 | 2 | 3 | 4 | 5   // 0-2 = fail, 3-5 = pass (feeds SM-2)
reviewedAt: Date
```

### DailyActivity
```
userId, date
cardsReviewed: number
correctCount: number
```
Used for the GitHub-style heatmap and streak tracking.

---

## Learning Process

### Session flow
```
1. Fetch due cards
   → SELECT cards WHERE dueAt <= now ORDER BY dueAt ASC LIMIT 20
   → new cards (state="new") are mixed in up to dailyGoal

2. Per card — generate display
   → static card: use stored question/answer
   → template card: call sandbox(template.code, card.seedInputs)
     returns { question, answer, hint?, explanation?, choices? }

3. User submits answer
   → normalize both sides (trim, lowercase optional)
   → isCorrect = userAnswer matches answer
   → quality = user self-rates 1-5, OR auto: isCorrect ? 4 : 1

4. SM-2 update (server-side only)
   if quality >= 3:
     interval = (prev_interval == 1) ? 6 : round(prev_interval * easeFactor)
     easeFactor = max(1.3, easeFactor + 0.1 - (5 - quality) * 0.08)
     state = "review"
   else:
     interval = 1
     state = "relearning"
   dueAt = now + interval days

5. Record Submission + upsert CardProgress + insert DailyActivity row

6. After session ends
   → if next dueAt is in the future, schedule push notification
```

---

## Stats

```
Per user:
  - GitHub heatmap: DailyActivity grouped by date
  - Total solved / total correct
  - Current streak (consecutive days with ≥1 review)

Per log:
  - totalCards
  - masteredCards (interval > 21 days)
  - averageEaseFactor
  - retentionRate (correct / total submissions)
```

---

## Notifications

- **Browser Push API + Service Worker**
- On first login user is prompted for push permission
- `pushSubscription` JSON stored on User
- Server sends push when a review session is due (daily cron: find users with cards due today)
- Service worker shows notification with "Start review" action that opens the app

---

## Stack

| Layer | Choice |
|---|---|
| Backend | NestJS |
| Database | PostgreSQL |
| Template sandbox | `isolated-vm` npm package |
| Frontend | React |
| Auth | JWT + bcrypt |
| Push notifications | Web Push API (`web-push` npm package) |
| SR algorithm | SM-2 (server-side, never client) |
| Math rendering | KaTeX (`katex` npm package) |

---

## LaTeX Rendering

Template cards support LaTeX in `question`, `hint`, `explanation`, and `choices` fields.

- **Component**: `frontend/src/components/Latex.tsx` — parses `$...$` (inline) and `$$...$$` (block) delimiters and renders via KaTeX.
- **Usage**: `<Latex>{someString}</Latex>` — only applied to template cards (`card.templateId` is set); static cards render plain text.
- **CSS**: KaTeX stylesheet imported in `frontend/src/main.tsx` as `import 'katex/dist/katex.min.css'` — required for correct math display.
- **Escaping in seed-tasks.js**: template `code` strings use `\\\\` (four backslashes in JS source) to produce a single `\` in the sandbox output, e.g. `'$\\\\lceil\\\\log_2(' + n + ')\\\\rceil$'` → `$\lceil\log_2(n)\rceil$`.
- **Errors**: `throwOnError: false` — invalid LaTeX degrades gracefully instead of crashing.

---

## Frontend UI System

### Component primitives

Two shared components in `frontend/src/components/`:

**`Card` / `Card.Header` / `Card.Body` / `Card.Footer` / `Card.Inset`**

```tsx
import { Card } from '../components/Card';

<Card variant="elevated" pad="md">
  <Card.Header><h3>Title</h3><button>×</button></Card.Header>
  <Card.Inset>nested content — gets inner radius automatically</Card.Inset>
  <Card.Footer>
    <Button variant="ghost">Cancel</Button>
    <Button variant="primary">Save</Button>
  </Card.Footer>
</Card>
```

Props:
- `variant`: `default` | `elevated` | `flat` | `outlined` | `tinted`
- `pad`: `none` | `sm` | `md` (default) | `lg`

**`Button` / `LinkButton`**

```tsx
import { Button, LinkButton } from '../components/Button';

<Button variant="primary" size="md" loading={isPending}>Save</Button>
<Button variant="danger" size="sm" icon="×" shape="square" />
<LinkButton to="/study" variant="primary">Start</LinkButton>
```

Props: `variant` (`primary` | `secondary` | `danger` | `ghost` | `subtle`), `size` (`sm` | `md` | `lg`), `shape` (`default` | `pill` | `square`), `loading`, `icon`, `iconRight`, `full`.

Use `LinkButton` (wraps react-router `Link`) wherever a styled button navigates. Use `Button` for actions.

### Rounding rule

CSS variables in `styles.css` enforce: **inner_r ≈ outer_r − (gap / 2)**

```
card2 outer radius = --r-lg (20px)
pad-sm (10px) → inner = --r-md (14px)   ← Card.Inset inside pad-sm card
pad-md (18px) → inner = --r-sm  (8px)   ← default
pad-lg (26px) → inner = --r-xs  (4px)
```

`Card.Inset` picks the right inner radius automatically based on the card's `pad` prop.

### CSS class coexistence

The new `card2` / `btn2` class system lives alongside the old `.card` / `.btn` classes. Old classes are still used in:
- `card-row`, `card-row-*` (log detail card list)
- `quality-btn` (study page rating buttons)
- `choice-btn` (multiple-choice answers)

Do not remove the old `.card` / `.btn` CSS blocks — they are still active.

---

## Theming

### ThemeContext

`frontend/src/contexts/ThemeContext.tsx` — provides `theme` (string) and `setTheme(theme)`.  
Persists the chosen theme to `localStorage` under key `"theme"` and writes `data-theme="<name>"` onto `<html>` immediately (including during state initialisation, to avoid flash-of-unstyled-theme).

```tsx
import { useTheme, type Theme } from '../contexts/ThemeContext';

const { theme, setTheme } = useTheme();
setTheme('dark'); // 'light' | 'dark' | 'ocean' | 'forest'
```

`ThemeProvider` wraps the whole app in `App.tsx` (outermost provider, above `AuthProvider`).

### CSS variable system

All theme colours are CSS custom properties on `:root`, overridden per theme in `styles.css` via `[data-theme="<name>"]` blocks.  The current theme-aware variables are:

| Group | Variables |
|---|---|
| Surfaces | `--bg`, `--card-bg`, `--input-bg`, `--hover-bg`, `--surface-2` |
| Text | `--text`, `--text-muted` |
| Border / Shadow | `--border`, `--shadow`, `--shadow-md` |
| Accent | `--primary`, `--primary-dark`, `--primary-light` |
| Semantic | `--success`, `--danger`, `--danger-dark`, `--warning` |
| Sidebar | `--sidebar-bg`, `--sidebar-text`, `--sidebar-text-muted`, `--sidebar-link`, `--sidebar-link-hover-bg`, `--sidebar-active-bg` |
| Component bg | `--banner-bg`, `--hint-bg`, `--hint-text-color`, `--hint-border` |
| Alerts | `--alert-error-bg/text/border`, `--alert-success-bg/border` |
| Heatmap | `--heatmap-0` … `--heatmap-4` (empty → full) |

When adding a new colour that must change across themes: add a variable to `:root`, use it in the component CSS, then override it in each `[data-theme]` block.  Never hardcode colours for structural/text elements.

### Adding a theme

1. Add a `[data-theme="<name>"]` block at the end of `styles.css` overriding the variables above.
2. Add the entry to the theme array in `Settings.tsx` (`{ id, label, color }`).
3. Export `Theme` type covers it automatically (it's a string union in ThemeContext).

---

## Sidebar

The sidebar is collapsible. State lives in `AppLayout` (`App.tsx`) and is persisted to `localStorage` under key `"sidebarOpen"` (default `true`).

- Open → `<nav class="sidebar">` — 220 px wide, sticky.
- Closed → `<nav class="sidebar sidebar-closed">` — width transitions to 0; a fixed `☰` button (`sidebar-open-btn`) appears top-left of the main area to reopen it.
- Toggle button (`sidebar-toggle`, renders `✕`) is always visible inside the sidebar header.

`Nav` accepts `isOpen: boolean` and `onToggle: () => void` props.

---

## Font

`--font` is set to `'JetBrains Mono', -apple-system, BlinkMacSystemFont, monospace`.  
JetBrains Mono is loaded from Google Fonts in `frontend/index.html`.

---

## Infrastructure

### Docker

Three services in `docker-compose.yml`:
- **postgres** — postgres:16-alpine, `pgdata` named volume, healthcheck on `pg_isready`
- **backend** — builds from `backend/Dockerfile` (multi-stage: build with `nest build`, run with prod deps), port 3000, waits for postgres healthcheck; `DATABASE_URL` uses service name `postgres` (not `localhost`)
- **frontend** — builds from `frontend/Dockerfile` (multi-stage: Vite build → nginx:alpine), port 80; `frontend/nginx.conf` proxies `/api/` → `http://backend:3000` and serves the SPA via `try_files`

**DB restore on fresh deploy:**
`db-dump.sql` is mounted as an init script in docker-compose — postgres runs it automatically when `pgdata` is empty.

```bash
docker compose down -v   # wipe pgdata volume
docker compose up -d     # postgres runs dump → backend starts
```

If the backend starts before the dump is applied (e.g. volume wasn't wiped), TypeORM will create empty tables first and the dump will fail with "relation already exists". Always `down -v` before a fresh restore.

### Seed scripts

Both scripts hit the local API at `http://localhost:3000/api` and authenticate as `oleg228@mail.ru`.

**`seed-tasks.js`** — creates 10 global templates + 10 logs + 30 cards per log (Russian CS exam topics).
- `node seed-tasks.js` — creates everything (errors if templates already exist)
- `node seed-tasks.js --update` — PATCHes existing templates by name only; skips log/card creation. Use this to push template code changes without recreating data.

**`dedup.js`** — removes duplicate templates/logs if seed was run more than once without `--update`. Keeps the oldest record per name; log deletion cascades to cards → card_progress + submissions.
- `node dedup.js`

---

## LaTeX Rendering

Template cards render math via KaTeX (`frontend/src/components/Latex.tsx`).

- Delimiters: `$...$` inline, `$$...$$` block
- Only applied to **template cards** (`card.templateId !== null`); static cards render plain text
- Applied to: question, hint, choices, correct answer, explanation in `Study.tsx`
- All 10 global templates in `seed-tasks.js` use LaTeX in hints and explanations

**Known bug — KaTeX not rendering in Docker:**
`import 'katex/dist/katex.min.css'` was removed from `Latex.tsx`. Without it Vite does not bundle KaTeX's stylesheet, so math shows as raw `$...$` in the production build. Fix: add the import to `frontend/src/main.tsx`:
```ts
import 'katex/dist/katex.min.css';
```
Then rebuild the frontend Docker image.
