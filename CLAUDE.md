# Uyên Thư Các – Frontend

Personal comic bookshelf web app. Frontend only; the backend is a separate FastAPI REST API.

## Stack
React + TypeScript + Vite + Tailwind CSS + React Router. Node >= 22.12. Package manager: npm.

## Rules
- Frontend only. No server code, no Firebase/Supabase, no Gemini API.
- All API calls live in src/services/ (base URL: VITE_API_URL). Services return mock data
  from src/mocks/ while VITE_USE_MOCK=true, so switching to the real API only changes src/services/.
- Never hard-code counts or colors in components. Colors come from theme CSS variables
  mapped to Tailwind tokens. Themes: "day" (Rừng tiên oải hương, default), "night" (Khu vườn tiên đêm).
- One responsive page per route (mobile-first, Tailwind breakpoints). Never separate mobile/desktop pages.
- Reuse existing components (ComicCard, Button, Modal, BottomSheet, EmptyState, Toast...)
  before creating new ones. Keep types in src/types/ with the existing field names.
- All UI text in Vietnamese, gentle tone addressing the user as "nàng".

## Designs
Stitch exports are in design/<page>/ (HTML + PNG, desktop and mobile).
Use them for layout and content. Ignore their colors (use the current theme),
and ignore nav items or labels that do not exist in this app.

## Before finishing any task
Run `npm run build` and fix all errors. Do not change pages unrelated to the task.