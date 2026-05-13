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
