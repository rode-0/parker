# Parker

Parker is a sulfur sales platform for managing customer relationships, building quotes, tracking benchmark pricing, and planning sales routes. Built with React, Express, and SQLite.

## Features

### Price Dashboard
- Real-time sulfur price tracking across benchmarks (Vancouver FOB, US Gulf Coast FOB, Tampa Contract DEL)
- Interactive SVG price history charts with benchmark switching
- Price ranges displayed with delivery terms and data sources

### Acuity Report Import
- Drag-and-drop PDF import for Acuity Regional Briefing (US & Canada)
- Parses sulphur prices, sulphuric acid, freight rates, related markets, and exchange rates
- Import history tracking with duplicate detection

### Quote Builder
- Generate customer quotes with grade, form, quantity, and freight inputs
- Live pricing preview with line-item breakdown (base price, grade/form adjustments, volume discounts)
- Quote lifecycle management (draft, sent, accepted, expired)

### Customer Management
- Import customers from Excel (.xlsx) or CSV with auto-detected column mapping
- Nominatim geocoding to pin customer addresses on a map
- Searchable customer list with filters for state, customer type, and priority
- Interactive Leaflet map with colored pins (by priority or customer type) and detail popups

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Leaflet, react-leaflet |
| Backend | Express, TypeScript, multer, pdf-parse, xlsx (SheetJS) |
| Database | SQLite via sql.js (WASM, no native deps) |
| Maps | Leaflet + OpenStreetMap tiles (free, no API key) |
| Geocoding | Nominatim / OpenStreetMap (free, 1 req/sec) |
| Testing | Vitest, Testing Library |
| Containers | Docker + Docker Compose |

## Repository Layout

```
parker/
├── frontend/                  # React SPA (port 5173)
│   └── src/
│       ├── pages/             # Dashboard, QuoteBuilder, QuoteList, Import,
│       │                      # Customers, CustomerImport, CustomerMap
│       ├── services/          # api.ts, customerApi.ts
│       └── types/             # index.ts, customer.ts
├── backend/                   # Express API (port 3001)
│   └── src/
│       ├── db/                # sql.js init, schema (6 tables)
│       ├── routes/            # prices, quotes, import, customers
│       ├── services/          # pricing, quotes, import, acuity-parser,
│       │                      # customers, customer-import, geocoder
│       └── types/             # index.ts, customer.ts, sql.js.d.ts, pdf-parse.d.ts
├── data/                      # Sample Acuity PDF for import testing
├── docker-compose.yml
├── CLAUDE.md                  # Project context for Claude Code
└── AGENTS.md                  # Coding standards and conventions
```

## Getting Started

### Docker

```bash
docker compose up --build
```

Frontend: http://localhost:5173 | Backend: http://localhost:3001

### Local Development

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start backend (terminal 1)
cd backend && npm run dev

# Start frontend (terminal 2)
cd frontend && npm run dev
```

## Commands

| Command | Location | Purpose |
|---------|----------|---------|
| `npm run dev` | backend | Start API with hot reload (port 3001) |
| `npm run dev` | frontend | Start Vite dev server (port 5173) |
| `npm run build` | either | Compile TypeScript |
| `npm run test` | either | Run Vitest in watch mode |
| `npm run test:run` | either | Run tests once |
| `npm run lint` | either | ESLint check |
| `docker compose up --build` | root | Start everything |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend API port |
| `DB_PATH` | `data/parker.db` | SQLite database file path |
| `VITE_API_URL` | `http://localhost:3001/api` | Frontend API base URL |

## API Reference

### Prices
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/prices` | Latest price per benchmark |
| `GET` | `/api/prices/:benchmark/history?days=365` | Historical prices |
| `POST` | `/api/prices` | Add manual price entry |

### Quotes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/quotes` | List quotes (optional `?status=` filter) |
| `GET` | `/api/quotes/:id` | Get single quote |
| `POST` | `/api/quotes` | Create quote |
| `POST` | `/api/quotes/preview` | Preview pricing without saving |
| `PATCH` | `/api/quotes/:id/status` | Update quote status |
| `DELETE` | `/api/quotes/:id` | Delete quote |

### Import
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/import/acuity` | Upload Acuity PDF (multipart) |
| `GET` | `/api/import/history` | List past imports |

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/customers` | List/search (`?search=&state=&customer_type=&priority=`) |
| `GET` | `/api/customers/:id` | Get single customer |
| `POST` | `/api/customers` | Create customer |
| `PUT` | `/api/customers/:id` | Update customer |
| `DELETE` | `/api/customers/:id` | Delete customer |
| `POST` | `/api/customers/import/preview` | Upload Excel/CSV, get column mapping preview |
| `POST` | `/api/customers/import` | Import with confirmed mapping + geocode |
| `POST` | `/api/customers/:id/geocode` | Re-geocode single customer |
| `GET` | `/api/customers/map` | Customers with coordinates for map |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Service health check |

## Database Schema

Six tables in SQLite:

- **sulfur_prices** -- benchmark prices with ranges (low/high cents), delivery terms, sources
- **freight_rates** -- shipping rates by route and vessel size
- **related_markets** -- ammonia, DAP, WTI, natural gas, copper
- **exchange_rates** -- BRL, CAD, CNY to USD
- **acuity_imports** -- import history metadata
- **quotes** -- customer quotes with full pricing breakdown
- **customers** -- customer CRM with geocoded coordinates

## Domain Notes

- All monetary values stored as integer cents (avoids floating point)
- Weights in metric tons (MT)
- Sulfur grades: Bright Yellow (99.9%+), Dark/Off-Spec, Recovered
- Sulfur forms: Molten, Prills, Granular, Blocks
- Pricing benchmarks match Acuity Regional Briefing format
- Customer types: Refinery, Fertilizer, Chemical, Mining, Other

## License

Private repository.
