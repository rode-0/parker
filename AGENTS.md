# Georgia Gulf Internal -- Agent & Development Guidelines

## Project Structure

Georgia Gulf Internal is a monorepo with two packages:

- `frontend/` -- React 18 + Vite SPA. Pages in `src/pages/`, API clients in `src/services/`, types in `src/types/`.
- `backend/` -- Express + TypeScript API. Routes in `src/routes/`, business logic in `src/services/`, database in `src/db/`, types in `src/types/`.

Root files: `docker-compose.yml`, `CLAUDE.md` (project context), `AGENTS.md` (this file).
Data files: `data/` contains sample import files (Acuity PDF).

## Build, Test & Dev Commands

Run commands from the package you are changing:

```bash
# Frontend (port 5173)
cd frontend && npm run dev         # Vite dev server with HMR
cd frontend && npm run build       # Type-check + production build
cd frontend && npm run test:run    # Vitest once
cd frontend && npm run lint        # ESLint

# Backend (port 3001)
cd backend && npm run dev          # tsx watch with hot reload
cd backend && npm run build        # Compile to dist/
cd backend && npm run test:run     # Vitest once
cd backend && npm run lint         # ESLint

# Docker
docker compose up --build          # Both services
```

## Coding Style

- TypeScript strict mode, 2-space indentation
- Semicolons, double-quoted strings
- Small single-purpose files (target under 400 lines)
- PascalCase for React components (`QuoteBuilder.tsx`)
- Lower-case for backend files (`acuity-parser.ts`, `customers.ts`)
- snake_case for API/database fields (`customer_name`, `freight_cents`)
- No emojis in code or comments
- Immutable patterns: spread operator, never mutate state

## Adding a New Feature

Follow existing patterns:

### Backend
1. **Types** -- Add to `backend/src/types/` (new file if large, otherwise extend `index.ts`)
2. **Service** -- Create `backend/src/services/yourfeature.ts` with async functions that call `getDatabase()`, use prepared statements for bulk ops, call `saveDatabase()` after writes
3. **Route** -- Create `backend/src/routes/yourfeature.ts` with Express Router. Validate inputs, call service functions, return `{ success: true, data }` or `{ success: false, error }`
4. **Schema** -- Add table to `backend/src/db/schema.ts` inside `initializeDatabase()`
5. **Register** -- Import router in `backend/src/index.ts`, add `app.use("/api/yourfeature", router)`

### Frontend
1. **Types** -- Add to `frontend/src/types/` with label maps and color maps
2. **API client** -- Create `frontend/src/services/yourFeatureApi.ts` following the `request<T>()` pattern
3. **Page** -- Create `frontend/src/pages/YourFeature.tsx` with `useState`/`useEffect`, loading/error states
4. **Route** -- Add `<Route>` in `frontend/src/main.tsx`, add `<NavLink>` in `frontend/src/App.tsx`
5. **CSS** -- Add classes to `frontend/src/index.css` (reuse existing `.card`, `.btn`, `.form-*`, `.badge` classes)

### Key Patterns to Reuse
- `rowToX(columns, values)` -- converts sql.js result arrays to typed objects
- `ApiResponse<T>` -- standard `{ success, data/error }` envelope
- Drag-and-drop file upload -- see `Import.tsx` or `CustomerImport.tsx`
- Filter bar with chart-tab buttons -- see `QuoteList.tsx` or `Customers.tsx`
- Multer memory storage for file uploads -- see `routes/import.ts`

## Database

sql.js (WASM SQLite). No native compilation needed.

- `getDatabase()` -- async singleton, lazy-initializes from file or creates new
- `saveDatabase()` -- exports DB to buffer, writes to `DB_PATH`
- `closeDatabase()` -- saves and closes on shutdown
- Prepared statements for bulk inserts: `db.prepare()` / `stmt.run([...])` / `stmt.free()`
- Dynamic WHERE clauses: build conditions array + params array (see `listCustomers`)

### Current Tables
| Table | Purpose |
|-------|---------|
| `sulfur_prices` | Benchmark prices with ranges and delivery terms |
| `freight_rates` | Shipping rates by route |
| `related_markets` | Ammonia, DAP, WTI, gas, copper |
| `exchange_rates` | BRL, CAD, CNY |
| `acuity_imports` | Import audit trail |
| `quotes` | Customer quotes with pricing breakdown |
| `customers` | Customer CRM with geocoded lat/lng |

## Testing

Vitest configured in both packages. Frontend loads Testing Library via `frontend/src/test-setup.ts`.

Priority areas for test coverage:
- Pricing calculations (`backend/src/services/pricing.ts`)
- Acuity PDF parsing (`backend/src/services/acuity-parser.ts`)
- Customer import column detection (`backend/src/services/customer-import.ts`)
- API-to-UI data flows

## Commits & PRs

- Conventional Commit prefixes: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- Small, focused commits
- PR descriptions should summarize behavior changes and list commands run
- Run `npm run test:run` in changed packages before committing

## Environment Variables

| Variable | Default | Where |
|----------|---------|-------|
| `PORT` | `3001` | Backend |
| `DB_PATH` | `data/gg-internal.db` | Backend |
| `VITE_API_URL` | `http://localhost:3001/api` | Frontend |

## External Services

| Service | Used For | Rate Limits |
|---------|----------|-------------|
| Nominatim (OSM) | Customer address geocoding | 1 req/sec, free, requires User-Agent header |
| OpenStreetMap tiles | Map rendering in Leaflet | Free, no API key |
| Acuity Commodities | Sulfur price reports (PDF import, not API) | Subscription-based |
