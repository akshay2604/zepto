# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (zepto-backend)
```bash
cd zepto-backend
./mvnw spring-boot:run          # start on :8080
./mvnw test                     # run all tests
./mvnw test -Dtest=ClassName    # run a single test class
./mvnw package -DskipTests      # build JAR
```

### Frontends
```bash
cd zepto-<app> && pnpm install && pnpm dev   # dev server
pnpm build                                   # production build
pnpm preview                                 # preview production build
```

Ports: `zepto-customer :5173` · `zepto-warehouse :5174` · `zepto-admin :5175` · `zepto-rider :5176`

### Database
```bash
createdb zepto    # one-time setup; Flyway applies migrations on first boot
```
To reset: drop and recreate the database. The backend seeds itself on startup (idempotent — skips if warehouses already exist).

## Architecture

### Request flow
All frontend fetch calls use **path-relative URLs** (e.g. `fetch('/orders')`). Vite's dev proxy rewrites these to `http://localhost:8080`. All 9 REST path prefixes (`/orders`, `/users`, `/catalog`, `/inventory`, `/warehouses`, `/payments`, `/analytics`, `/system`, `/stream`) are proxied identically across all four Vite configs.

In production, a reverse proxy is expected to do the same.

### Real-time (SSE)
Two SSE streams are exposed at `/stream/orders` and `/stream/inventory`. `SseEmitterService` keeps an in-memory `ConcurrentHashMap<String, CopyOnWriteArrayList<SseEmitter>>` — topic → emitters. Any service that needs to broadcast calls `sseEmitterService.publish(topic, eventName, payload)`. Emitters are cleaned up automatically on timeout (30 min), error, or completion.

Frontend hooks open a native `EventSource` and listen for named events (`order-update`, `inventory-update`). On error the `EventSource` is closed and cleaned up; React effects handle reconnection on remount.

### Order lifecycle
Orders move through a strict status machine enforced in `OrderLifecycleService`:

```
PLACED → PAYMENT_PENDING → CONFIRMED → PICKING → PACKED → OUT_FOR_DELIVERY → DELIVERED
                                                                            ↘ CANCELLED
```

Each transition is a dedicated POST endpoint (e.g. `POST /orders/{id}/confirm`, `/start-picking`, `/pack`, `/assign-rider`, `/out-for-delivery`, `/deliver`). Every transition publishes an `order-update` SSE event. The `SimulatorView` in `zepto-admin` drives the full cycle manually for demo purposes.

### Domain model
Core entities and their key relationships:

- **UserAccount** → many **Address** (one `is_default`)
- **Product** → many **ProductVariant** (each variant has a unique `sku_code`)
- **InventoryLedger** — unique per `(warehouse_id, variant_id)`; tracks `qty_on_hand` and `qty_reserved`
- **Order** → many **OrderItem** (variant + qty + prices snapshot)
- **Order** → one **Payment** (1:1) and one **Delivery** (1:1)
- **StockMovement** — append-only audit log; `movement_type` enum: `INBOUND / ORDER_RESERVE / ORDER_PICK / ORDER_CANCEL / SPOILAGE / ADJUSTMENT`; `reference_id` points back to the source order

### Backend package layout
```
com.zepto/
  controller/   REST handlers (thin — delegate immediately to services)
  service/      business logic (OrderService, InventoryService, etc.)
  entity/       JPA entities + enums
  dto/          request/ and response/ subpackages
  repository/   Spring Data JPA interfaces
  sse/          SseController + SseEmitterService
  config/       CorsConfig
  exception/    GlobalExceptionHandler
```

### Seed data
`SeedDataService` fires on `ApplicationReadyEvent`. It seeds 4 Bengaluru warehouses, 3 pickers per warehouse, and inventory from `master-catalog.json` (50–200 units per variant per warehouse, reorder threshold = 20). To re-seed, drop and recreate the DB.

### Schema management
Flyway owns the schema (`spring.jpa.hibernate.ddl-auto=validate`). Add new migrations as `V{n}__description.sql` in `src/main/resources/db/migration/`.

### No auth
All endpoints are public — no authentication or authorization layer exists. This is intentional for the simulation.
