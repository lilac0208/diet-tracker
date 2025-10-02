## Diet Tracker — React + Vite

Modern, local-first diet tracking app with optional cloud backup. Built with React, Vite, Tailwind CSS, Zustand, and Supabase. Deployed on Vercel.

— Live Demo:https://diet-tracker-fvmc49cxp-derek-chens-projects-de3f9b18.vercel.app (replace with your actual Vercel URL)

### Features
- Daily overview with macro and calorie progress
- Meal logging by date and preset meal library
- Goal setting (protein, fat, carb, kcal)
- Statistics and history views
- Weight tracking
- Dark mode by default
- Local persistence (IndexedDB/localStorage via Zustand persist)
- Optional Supabase sync (user-owned JSON blob backup)

### Tech Stack
- React 19 + React Router v6
- Vite 7 for build and dev server
- Tailwind CSS (+ `@tailwindcss/forms`)
- Zustand (state, persist middleware)
- Recharts (charts) and Framer Motion (animations)
- Supabase JS (optional cloud backup)
- ESLint 9

### High-Level Architecture
- UI: Component-driven pages under `src/components`, routed via `react-router-dom` in `src/App.jsx` and `src/main.jsx` with `BrowserRouter`.
- State: Central store in `src/stores/useDietStore.js` (Zustand), persisted to `localStorage` (key: `diet-tracker`).
- Data model: Profile, goals, preferences, meal library, mealsByDate, weightHistory.
- Cloud sync: Optional push/pull of a single JSON blob to Supabase table `diet_backups` keyed by `user_id`. Debounced auto-push.
- Styling: Tailwind utility classes with dark mode toggled via `document.documentElement.classList`.

### Directory Structure (relevant)
```
src/
  main.jsx              # App entry, BrowserRouter
  App.jsx               # Route definitions and guards
  components/
    Dashboard.jsx       # Shell + tabs + route nest
    TodayProgress.jsx   # Daily macro/kcal summary
    MealLogger.jsx      # Add meals
    MealLibrary.jsx     # Preset meals
    GoalSetter.jsx      # Macro & calorie goals
    History.jsx         # Daily history
    StatisticsPage.jsx  # Charts (Recharts)
    WeightTracker.jsx   # Weight records
    Settings.jsx        # Preferences + cloud settings
    AISuggestions.jsx   # Placeholder/AI tips area
  stores/
    useDietStore.js     # Zustand store + persist + Supabase sync
  utils/
    supabaseClient.js   # Lazy client init via VITE env
```

### Routing Overview
- `/overview` (default landing) — Requires profile and goals
- `/profile` — Create/update user profile (BMR/TDEE shown)
- `/goals` — Set macro/kcal targets
- `/meals` — Log meals + see today progress
- `/library` — Manage preset meals
- `/history` — Browse historical records
- `/statistics` — Charts and trends
- `/weight` — Weight tracking
- `/settings` — Preferences and cloud sync

### State & Persistence
- Store: `useDietStore`
  - `profile`, `goals`, `preferences.darkMode` (default true)
  - `mealLibrary`, `mealsByDate`, `weightHistory`
  - Helpers: `todayTotals()`, `getMealsByDate(date)`, `getDateRangeStats(start,end)`
- Persistence: Zustand `persist` with key `diet-tracker` (local-first UX)

### Cloud Sync (Supabase)
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Table expected: `diet_backups` with columns: `user_id (text primary key)`, `data (jsonb)`, `updated_at (timestamptz)`
- Strategy:
  - Debounced `pushToCloud` (3s) when local data changes and cloud auto-sync is enabled
  - `pullFromCloud` on first load if auto and no `lastSyncAt`
  - Conflict strategy: default `local_wins`; can be configured to `remote_wins`

SQL (Supabase example):
```
create table if not exists public.diet_backups (
  user_id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Row Level Security
alter table public.diet_backups enable row level security;

-- Replace auth.uid() checks with your auth strategy if needed.
create policy "Allow owner read" on public.diet_backups for select using (auth.uid()::text = user_id);
create policy "Allow owner upsert" on public.diet_backups for insert with check (auth.uid()::text = user_id);
create policy "Allow owner update" on public.diet_backups for update using (auth.uid()::text = user_id);
```

### Getting Started
1) Install
```
npm install
```
2) Local dev
```
npm run dev
```
3) Build & preview
```
npm run build
npm run preview
```
4) Optional: Supabase env
```
# .env.local
VITE_SUPABASE_URL=https://bwdckaatbmothqxkxlha.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

### Deployment (Vercel)
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` if using cloud backup
- SPA fallback: Vercel automatically serves `index.html` for unknown routes; ensure clean URLs

### Scripts
- `dev`: Vite dev server
- `build`: Vite production build
- `preview`: Local static preview
- `lint`: ESLint 9 config with React hooks and refresh plugins

### Security & Privacy Notes
- Local-first by design; cloud backup is optional and user-initiated/configured
- When enabled, entire app state is stored as a single JSON blob in Supabase under your `user_id`

### Roadmap Ideas (speculative)
- Offline-first enhancements (workbox/Service Worker)
- Multi-user auth + per-record sync and merge
- Macro goal presets by profile and activity level
- CSV import/export for meals and weight history

### License
MIT (or your preferred license)
