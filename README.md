# Coffee Shop Backend API — Production Specification

A production-grade, enterprise monolithic backend system for a modern Coffee Shop, built with **Java 21**, **Spring Boot 3.3**, and **PostgreSQL**.

---

## 1. Architectural Principles

This application adheres to senior engineering principles for scalable monoliths:

* **Modular Monolith**: Strict domain separation across packages (`auth`, `customer`, `product`, `inventory`, `cart`, `order`, `payment`, `outbox`, `notification`, `audit`, `common`).
* **Strong Consistency inside PostgreSQL**: Order creation, server-side pricing validation, inventory reservation, and transactional outbox registration execute inside **ONE database transaction**.
* **Transactional Outbox Pattern**: Asynchronous side-effects (SMS/Push notifications, analytics, audit trail) are published via the `outbox_events` table and dispatched by an asynchronous background worker with exponential backoff and dead-letter handling.
* **Optimistic Locking**: The `Inventory` model uses `@Version` and a reservation pattern (`onHand`, `reserved`, `available = onHand - reserved`) to prevent concurrency overselling without table locks.
* **Idempotency**: Critical endpoints (`POST /api/v1/orders`, `POST /api/v1/payments`) enforce an `Idempotency-Key` header with SHA-256 payload verification and atomic response caching.
* **Resilient External Payment Boundary**: External payment gateway calls run outside active database transactions to prevent connection pool exhaustion. Network timeouts are treated as `UNKNOWN` (not failed) and reconciled asynchronously.
* **Standardized API Envelope**: All REST endpoints return a unified response schema:
  ```json
  {
    "success": true,
    "data": { ... },
    "error": null,
    "meta": { "page": 0, "size": 20, "totalElements": 45, "totalPages": 3 }
  }
  ```

---

## 2. API Endpoints Overview

Base URL: `/api/v1`

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register customer | Public |
| `POST` | `/api/v1/auth/login` | Login with phone & password | Public |
| `POST` | `/api/v1/auth/refresh` | Refresh JWT tokens | Public |
| `GET` | `/api/v1/customers/me` | Get current customer profile | Authenticated |
| `PATCH`| `/api/v1/customers/me` | Update customer profile | Authenticated |
| `GET` | `/api/v1/products` | Browse catalog (filter, sort, page) | Public |
| `GET` | `/api/v1/products/{id}` | Get product details | Public |
| `POST` | `/api/v1/admin/products`| Create product + inventory | `ADMIN` |
| `PATCH`| `/api/v1/admin/products/{id}`| Update product | `ADMIN` |
| `DELETE`| `/api/v1/admin/products/{id}`| Soft delete product | `ADMIN` |
| `GET` | `/api/v1/admin/inventory/{id}`| Get stock level | `ADMIN` |
| `PATCH`| `/api/v1/admin/inventory/{id}`| Adjust or replenish stock | `ADMIN` |
| `GET` | `/api/v1/cart` | View customer cart | Authenticated |
| `POST` | `/api/v1/cart/items` | Add item to cart | Authenticated |
| `PATCH`| `/api/v1/cart/items/{itemId}`| Update cart item quantity | Authenticated |
| `DELETE`| `/api/v1/cart/items/{itemId}`| Remove item from cart | Authenticated |
| `POST` | `/api/v1/orders` | Create order (atomic reservation) | Authenticated |
| `GET` | `/api/v1/orders` | List customer orders | Authenticated |
| `GET` | `/api/v1/orders/{orderId}` | Get order details | Authenticated |
| `POST` | `/api/v1/orders/{orderId}/cancel` | Cancel order & release stock | Authenticated |
| `GET` | `/api/v1/staff/orders` | Staff orders queue | `STAFF`, `ADMIN` |
| `PATCH`| `/api/v1/staff/orders/{id}/status` | Advance order state machine | `STAFF`, `ADMIN` |
| `GET` | `/api/v1/admin/orders` | Admin global order search | `ADMIN` |
| `POST` | `/api/v1/payments` | Process payment | Authenticated |
| `GET` | `/api/v1/payments/order/{id}` | Get order payment details | Authenticated |

---

## 3. Getting Started

### Prerequisites
* Java 21+
* Maven 3.9+
* Docker & Docker Compose

### 1. Start PostgreSQL
```bash
docker compose up -d
```

### 2. Run Database Migrations & Start Server
```bash
mvn clean spring-boot:run
```

### 3. Access Swagger / OpenAPI 3 UI
Navigate to:
```text
http://localhost:8080/swagger-ui.html
```

---

## 4. Running Tests
Run all unit and integration tests:
```bash
mvn test
```
