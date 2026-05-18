# Zepto — Delivery Platform Simulation

A full-stack simulation of a quick-commerce delivery platform. Four React frontends talk to a single Spring Boot backend over REST + SSE.

## Architecture

```
zepto-customer   :5173   →  customer shopping & live order tracking
zepto-warehouse  :5174   →  warehouse picker queue & inventory board
zepto-admin      :5175   →  ops dashboard, catalog, analytics
zepto-rider      :5176   →  rider delivery feed
zepto-backend    :8080   →  Spring Boot REST API + SSE (PostgreSQL)
```

## Stack

| Layer     | Tech                                      |
|-----------|-------------------------------------------|
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS  |
| Backend   | Spring Boot 3.3, Java 21, JPA             |
| Database  | PostgreSQL (schema managed by Flyway)     |
| Realtime  | Server-Sent Events (SSE)                  |

## Getting started

### Prerequisites

- Node.js + pnpm
- Java 21
- PostgreSQL running locally on port 5432

### Backend

```bash
# Create the database
createdb zepto

# Run (Flyway will apply migrations automatically)
cd zepto-backend
./mvnw spring-boot:run
```

Default DB config in `src/main/resources/application.properties` — update username/password to match your local Postgres.

### Frontends

Each app is independent. Run any or all:

```bash
cd zepto-customer  && pnpm install && pnpm dev   # :5173
cd zepto-warehouse && pnpm install && pnpm dev   # :5174
cd zepto-admin     && pnpm install && pnpm dev   # :5175
cd zepto-rider     && pnpm install && pnpm dev   # :5176
```

## Project structure

```
zepto/
├── zepto-backend/      Spring Boot API
│   ├── src/main/java/com/zepto/
│   │   ├── controller/ REST endpoints
│   │   ├── service/    business logic
│   │   ├── entity/     JPA entities
│   │   ├── dto/        request / response DTOs
│   │   ├── repository/ Spring Data repositories
│   │   └── sse/        SSE emitter service
│   └── src/main/resources/
│       ├── application.properties
│       ├── db/migration/   Flyway SQL migrations
│       └── master-catalog.json
├── zepto-customer/     🛒 Customer app
├── zepto-warehouse/    🏭 Warehouse app
├── zepto-admin/        ⚙️  Admin app
└── zepto-rider/        🏍️  Rider app
```
