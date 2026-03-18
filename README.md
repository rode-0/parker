# Parker

Parker is a sulfur sales tool for building customer quotes, tracking benchmark pricing, and importing Acuity market reports. The repository is split into a React frontend and an Express backend, with local persistence handled through `sql.js`.

## Features

- Price dashboard for benchmark sulfur prices and historical trends
- Quote builder with live pricing preview
- Quote list and status management
- PDF import flow for Acuity regional briefing reports
- Import history tracking for uploaded reports

## Tech Stack

- Frontend: React 18, TypeScript, Vite
- Backend: Express, TypeScript
- Storage: `sql.js`
- Testing: Vitest, Testing Library on the frontend
- Local containers: Docker Compose

## Repository Layout

```text
.
├── frontend/              # React app
│   └── src/
│       ├── pages/         # Dashboard, quotes, import UI
│       ├── services/      # API client
│       └── types/         # Shared frontend types
├── backend/               # Express API
│   └── src/
│       ├── db/            # Database init and schema
│       ├── routes/        # API route handlers
│       ├── services/      # Pricing, quotes, import logic
│       └── types/         # Backend types
├── data/                  # Sample/source import files
├── docker-compose.yml
└── AGENTS.md
```

## Getting Started

### Option 1: Docker

```bash
docker compose up --build
```

This starts:

- Frontend at `http://localhost:5173`
- Backend at `http://localhost:3001`

### Option 2: Run Each App Locally

Install dependencies in both packages:

```bash
cd backend && npm install
cd ../frontend && npm install
```

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

## Useful Commands

### Frontend

```bash
cd frontend
npm run dev
npm run build
npm run lint
npm run test
npm run test:run
```

### Backend

```bash
cd backend
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run test:run
```

## Configuration

Backend environment variables:

- `PORT`: API port, defaults to `3001`
- `DB_PATH`: path to the persisted database file

Frontend environment variables:

- `VITE_API_URL`: API base URL, set to `http://localhost:3001/api` in Docker

## API Overview

Key backend routes:

- `GET /api/health`
- `GET /api/prices`
- `GET /api/prices/:benchmark/history?days=365`
- `POST /api/prices`
- `GET /api/quotes`
- `POST /api/quotes`
- `POST /api/quotes/preview`
- `PATCH /api/quotes/:id/status`
- `DELETE /api/quotes/:id`
- `POST /api/import/acuity`
- `GET /api/import/history`

The import endpoint accepts PDF uploads and is configured for files up to 10 MB.

## Domain Notes

- Monetary values are stored as integer cents
- Quantities are expressed in metric tons
- Benchmarks include `tampa_cfr`, `vancouver_fob`, `middle_east_fob`, and `china_cfr`
- A sample Acuity report PDF is available under `data/`

## Testing

Vitest is configured in both apps. The frontend also loads `@testing-library/jest-dom` in `frontend/src/test-setup.ts`. Run `npm run test:run` in the package you are changing before opening a pull request.
