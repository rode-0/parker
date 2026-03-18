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

### Acuity PDF Import
- Biweekly Acuity Regional Briefing (US & Canada) PDFs imported via `/import`
- Parses sulphur prices, sulphuric acid, freight rates, related markets, exchange rates
- Price ranges stored as `price_low_cents` / `price_high_cents`
- Re-importing same report date replaces previous data

## Feature: Sales Route Planner (Planned)

### Overview
Import customer data from Excel spreadsheets and display on a map-based dashboard.
Plan optimized multi-day sales trips based on customer locations, working hours,
and travel constraints. Designed for field sulfur sales reps covering large territories
(US & Canada).

### Customer Data Model
```
customers table:
  id              INTEGER PRIMARY KEY
  company_name    TEXT NOT NULL
  contact_name    TEXT NOT NULL
  email           TEXT
  phone           TEXT
  address         TEXT NOT NULL
  city            TEXT NOT NULL
  state           TEXT NOT NULL
  zip             TEXT
  country         TEXT NOT NULL DEFAULT 'US'
  latitude        REAL          -- geocoded from address
  longitude       REAL          -- geocoded from address
  customer_type   TEXT          -- 'refinery', 'fertilizer', 'chemical', 'mining', 'other'
  annual_volume_mt REAL         -- estimated annual sulfur volume
  last_visit      TEXT          -- ISO date of last sales visit
  priority        TEXT          -- 'high', 'medium', 'low'
  notes           TEXT
  created_at      TEXT
  updated_at      TEXT
```

### Excel Import
- Accept `.xlsx` and `.csv` uploads via drag-and-drop
- Map spreadsheet columns to customer fields (auto-detect common headers)
- Geocode addresses to lat/lng on import using Nominatim (OpenStreetMap)
- Nominatim constraints: max 1 request/second, free, no API key required
- Show preview table before committing import
- Skip rows with missing required fields (company_name, address, city, state)

### Customer Dashboard
- List view with search/filter by state, customer type, priority
- Map view showing all customer pins (use Leaflet + OpenStreetMap tiles, free)
- Color pins by priority or customer type
- Click pin to see customer details, last visit date, annual volume

### Sales Route Optimizer
- Select customers to visit from the map or list
- Set constraints:
  - Start location (home office or airport)
  - Working hours per day (default 8h, configurable)
  - Max driving time per day (default 6h)
  - Visit duration per customer (default 1.5h, override per customer)
  - Trip duration (number of days)
  - Overnight hotel stops (auto-placed based on end-of-day location)
- Route engine: OpenRouteService Optimization API (free tier)
  - Solves TSP/VRP via VROOM engine
  - Free: 2,000 direction requests/day, 500 optimization/day
  - Handles time windows, vehicle constraints, multi-day splits
- Driving time/distance: OpenRouteService Directions API
- Display optimized route on map with day-by-day breakdown
- Show per-day itinerary: customer visits, drive times, hotel stop location
- Export itinerary as printable summary

### Free APIs Used
| Service | Purpose | Limits |
|---------|---------|--------|
| Nominatim (OSM) | Geocode customer addresses | 1 req/sec, free, no key |
| OpenRouteService | Route optimization (TSP/VRP) | 2,000 directions/day, 500 optimizations/day, free key |
| OpenRouteService | Drive time matrix between stops | 500 matrix requests/day |
| Leaflet + OSM tiles | Map rendering | Free, open source |

### Constraints and Limitations
- Nominatim geocoding is rate-limited to 1/sec; batch import of 500 customers takes ~8 min
- OpenRouteService free tier caps at ~50 stops per optimization request
- For trips with 20+ stops, split into multi-day sub-problems
- No real-time traffic; uses average drive times
- Hotel suggestions are approximate (nearest city to end-of-day location), not booking
- US and Canada addresses only (matches sulfur sales territory)
- Airport lookup is informational only (nearest major airport to start/end point)

### Implementation Plan
1. **Phase 1 — Customer DB + Excel Import**: schema, upload endpoint, Nominatim geocoding, list view
2. **Phase 2 — Map Dashboard**: Leaflet map, customer pins, filters, click-to-detail
3. **Phase 3 — Route Planner**: constraint form, OpenRouteService integration, day-by-day itinerary
4. **Phase 4 — Polish**: export to PDF, hotel proximity suggestions, airport distance info
