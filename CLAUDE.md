# Parker — Sulfur Sales Quote Builder & Price Dashboard

## Project Overview

Parker is a sulfur sales tool combining a **Quote Builder** and a **Price Dashboard**. It helps sulfur sales professionals generate customer quotes factoring in grade, quantity, freight costs, and current market rates, while monitoring real-time and historical sulfur pricing data.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express + TypeScript
- **Database**: SQLite (via better-sqlite3)
- **Containerization**: Docker + Docker Compose
- **Testing**: Vitest (frontend + backend)

## Architecture

```
parker/
├── frontend/          # React SPA
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Route pages
│   │   ├── services/     # API client
│   │   ├── hooks/        # Custom React hooks
│   │   └── types/        # TypeScript types
│   ├── Dockerfile
│   └── package.json
├── backend/           # Express API
│   ├── src/
│   │   ├── routes/       # API route handlers
│   │   ├── services/     # Business logic
│   │   ├── db/           # Database schema + queries
│   │   └── types/        # TypeScript types
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── CLAUDE.md
```

## Commands

```bash
# Development
docker compose up --build          # Start all services
docker compose up frontend         # Frontend only (port 5173)
docker compose up backend          # Backend only (port 3001)

# Testing
cd frontend && npm test            # Frontend tests
cd backend && npm test             # Backend tests

# Linting
cd frontend && npm run lint
cd backend && npm run lint
```

## Code Conventions

- No emojis in code or comments
- Immutable patterns: spread operator, never mutate state directly
- Files should stay under 400 lines; split if larger
- TypeScript strict mode enabled
- Use `type` over `interface` unless extending
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- All monetary values stored as integers (cents) to avoid floating point issues
- All weights in metric tons

## API Response Format

```typescript
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }
```

## Domain Concepts

### Sulfur Grades
- Bright Yellow (99.9%+ purity)
- Dark/Off-spec (lower purity, discounted)
- Recovered (from oil/gas refining)

### Sulfur Forms
- Molten (liquid, bulk transport)
- Prills (small pellets)
- Granular (larger pellets)
- Blocks/Slates (solid formed)

### Key Pricing Benchmarks
- Tampa CFR (US Gulf Coast reference)
- Vancouver FOB (Western Canada)
- Middle East FOB
- China CFR

### Quote Components
- Base price (per metric ton, tied to benchmark)
- Grade premium/discount
- Form premium
- Freight cost
- Volume discount
- Total = (base + grade adj + form adj + freight) * quantity - volume discount
