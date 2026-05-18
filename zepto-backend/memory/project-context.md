---
name: project-context
description: zepto-sim Spring Boot backend — stack, DB setup, known fixes, how to run
metadata:
  type: project
---

## Project

Spring Boot 3.3.5 quick-commerce backend API (Zepto simulator). Java 21 + PostgreSQL + Flyway + Lombok.

**Why:** Simulates a dark-store/quick-commerce backend with warehouses, catalog, orders, deliveries, inventory, analytics, and SSE feed.

## How to run

```bash
mvn spring-boot:run
```

No `mvnw` — uses system `mvn` (installed via Homebrew).

## Database

- Engine: local PostgreSQL
- DB name: `zepto`, user: `akshay`, no password
- Schema managed by Flyway; migration at `src/main/resources/db/migration/V1__init_schema.sql`
- To regenerate schema: `mvn spring-boot:run -Dspring-boot.run.profiles=ddl-export` (writes SQL file, app crashes — that's expected; then truncate `flyway_schema_history` and restart normally)

## Key config (application.properties)

```
spring.datasource.username=akshay
spring.datasource.password=
spring.jpa.hibernate.ddl-auto=validate
```

## Build quirks fixed

- **Lombok 1.18.38 required** — 1.18.34/1.18.36 crash with `TypeTag::UNKNOWN` on Java 21.0.11 (April 2026 LTS update)
- **pom.xml**: `<lombok.version>1.18.38</lombok.version>` + maven-compiler-plugin with `<fork>true</fork>` + `annotationProcessorPaths`
- **`this::staticMethod` refs** illegal in Java 21 strict mode — fixed in `DeliveryService` (`DeliveryService::toResponse`) and `UserService` (`UserService::toAddressResponse`)
- **Missing catalog POJOs** — created `com.zepto.catalog.{CatalogRoot, CatalogCategory, CatalogProduct, CatalogSku}` for JSON deserialization in `SeedDataService`

## Runtime bugs fixed

- `InventoryLedgerRepository.findAll()` caused `LazyInitializationException` — added `findAllWithVariantAndWarehouse()` with JOIN FETCH
- `DeliveryRepository.findAvgDeliveryTimeStats()` returned `Object[]` but Hibernate wraps aggregates as `List<Object[]>` — changed return type accordingly

## Entities

Address, Category, Delivery, InventoryLedger, Order, OrderItem, Payment, Product, ProductVariant, StockMovement, UserAccount, Warehouse

## Seed data

`SeedDataService` fires on `ApplicationReadyEvent`, seeds from `src/main/resources/master-catalog.json` (Bengaluru dark stores, grocery/FMCG catalog).
