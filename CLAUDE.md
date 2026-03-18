# Parker -- Sulfur Sales Platform

## Project Overview

Parker is a full-stack sulfur sales tool for field sales reps covering US and Canada territories. It combines pricing intelligence, quote generation, customer management, and territory mapping into one app.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Leaflet
- **Backend**: Express + TypeScript + sql.js (WASM SQLite)
- **Geocoding**: Nominatim (OpenStreetMap, free, 1 req/sec)
- **Maps**: Leaflet + OpenStreetMap tiles (free, no API key)
- **File Parsing**: pdf-parse (Acuity PDFs), xlsx/SheetJS (customer spreadsheets)
- **Containerization**: Docker + Docker Compose

## Architecture

```
parker/
├── frontend/src/
│   ├── pages/
│   │   ├── Dashboard.tsx         # Price dashboard with SVG charts
│   │   ├── QuoteBuilder.tsx      # Quote creation with live preview
│   │   ├── QuoteList.tsx         # Quote management table
│   │   ├── Import.tsx            # Acuity PDF import
│   │   ├── Customers.tsx         # Customer list with search/filter
│   │   ├── CustomerImport.tsx    # Excel/CSV import (3-step flow)
│   │   └── CustomerMap.tsx       # Leaflet map with colored pins
│   ├── services/
│   │   ├── api.ts                # Prices, quotes, import API client
│   │   └── customerApi.ts        # Customer API client
│   └── types/
│       ├── index.ts              # Price, quote, import types + label maps
│       └── customer.ts           # Customer types, colors, field definitions
├── backend/src/
│   ├── db/
│   │   ├── index.ts              # sql.js singleton (getDatabase, saveDatabase)
│   │   └── schema.ts             # 7 tables: sulfur_prices, freight_rates,
│   │                             #   related_markets, exchange_rates,
│   │                             #   acuity_imports, quotes, customers
│   ├── routes/
│   │   ├── prices.ts             # GET/POST /api/prices
│   │   ├── quotes.ts             # CRUD /api/quotes
│   │   ├── import.ts             # POST /api/import/acuity
│   │   └── customers.ts          # CRUD /api/customers + import + geocode
│   ├── services/
│   │   ├── pricing.ts            # Price queries, quote price calculation
│   │   ├── quotes.ts             # Quote CRUD
│   │   ├── acuity-parser.ts      # PDF text parsing for Acuity reports
│   │   ├── import.ts             # Acuity PDF import orchestration
│   │   ├── customers.ts          # Customer CRUD + map queries
│   │   ├── customer-import.ts    # Excel/CSV parsing, column detection
│   │   └── geocoder.ts           # Nominatim geocoding with throttle
│   └── types/
│       ├── index.ts              # Price, quote, API types
│       └── customer.ts           # Customer, import result types
├── data/                         # Sample Acuity PDF
└── docker-compose.yml
```

## Commands

```bash
cd backend && npm run dev          # API on :3001
cd frontend && npm run dev         # UI on :5173
docker compose up --build          # Both via Docker
cd backend && npm run test:run     # Backend tests
cd frontend && npm run test:run    # Frontend tests
```

## Code Conventions

- TypeScript strict mode, 2-space indent, semicolons, double quotes
- No emojis in code or comments
- Immutable patterns (spread, never mutate)
- Files under 400 lines; split if larger
- `type` over `interface` unless extending
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- Monetary values as integer cents
- Weights in metric tons
- API fields in snake_case (e.g. `customer_name`, `freight_cents`)

## API Response Format

```typescript
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }
```

## Database Patterns

- sql.js (WASM SQLite): async `getDatabase()` singleton, `saveDatabase()` after writes
- Prepared statements for bulk inserts (`db.prepare()` / `stmt.run()` / `stmt.free()`)
- Row conversion: `rowToX(columns, values)` maps sql.js result arrays to typed objects
- Schema in `db/schema.ts` via `db.run()` with `CREATE TABLE IF NOT EXISTS`

## Domain Concepts

### Sulfur
- **Grades**: Bright Yellow (99.9%+), Dark/Off-Spec, Recovered
- **Forms**: Molten, Prills, Granular, Blocks/Slates
- **Benchmarks**: Vancouver FOB, US Gulf Coast FOB, Tampa Q Contract DEL, US Spot CFR (Acid)

### Quote Pricing
- Base price = midpoint of benchmark range
- Grade adjustment: Bright Yellow +$5, Dark -$8, Recovered -$3
- Form adjustment: Molten $0, Prills +$2, Granular +$1.50, Blocks -$1
- Volume discounts: 1000+ MT -$1, 5000+ MT -$2, 10000+ MT -$3
- Total = (base + grade + form + freight - discount) * quantity

### Acuity Import
- Biweekly Acuity Regional Briefing (US & Canada) PDF
- Parses: sulphur prices, sulphuric acid, freight rates, related markets, exchange rates
- Price ranges stored as `price_low_cents` / `price_high_cents`
- Re-importing same report date replaces previous data

### Customers
- Imported from Excel/CSV with fuzzy column auto-detection
- Geocoded via Nominatim (1 req/sec, US & Canada)
- Types: Refinery, Fertilizer, Chemical, Mining, Other
- Priority: High, Medium, Low
- Map pins colored by priority or customer type

## Planned: Sales Route Optimizer (Phase 2+)

### Phase 2 -- Route Planning
- Select customers to visit from map or list
- Set constraints: working hours/day, max drive time, visit duration, trip length
- OpenRouteService Optimization API (free tier, VROOM engine)
- Day-by-day itinerary with drive times and hotel stop placement

### Phase 3 -- Polish
- Export itinerary as printable PDF
- Hotel proximity suggestions (nearest city at end-of-day)
- Airport distance info for trip start/end
- Customer visit history tracking

### Free APIs for Route Planning
| Service | Purpose | Limits |
|---------|---------|--------|
| Nominatim | Geocode addresses | 1 req/sec, free |
| OpenRouteService | Route optimization (TSP/VRP) | 2,000 directions/day, 500 optimizations/day |
| Leaflet + OSM tiles | Map rendering | Free, open source |
