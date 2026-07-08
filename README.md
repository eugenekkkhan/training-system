# Training System

Платформа интервального повторения (spaced repetition): карточки могут быть статичными или генерироваться процедурно из JS-шаблонов — одна и та же тема каждый раз даёт новые значения в задаче.

## Структура (npm workspaces)

- `frontend/` — React, TypeScript, React Query, i18next (RU/EN), KaTeX для формул
- `backend/` — NestJS, TypeORM, PostgreSQL, JWT-авторизация, планировщик повторений
- `shared/` — общие типы и утилиты

## Запуск

```bash
npm install
npm run db:up          # PostgreSQL в Docker
npm run dev:backend
npm run dev:frontend
```

## Стек

React, TypeScript, React Query, NestJS, TypeORM, PostgreSQL, Docker Compose
