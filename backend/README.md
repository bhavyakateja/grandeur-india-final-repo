# backend

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

## Logging

Logging is JSON in production and formatted locally in development. Every HTTP response includes
`x-request-id` and `x-correlation-id`; clients may safely supply either identifier using letters,
numbers, `.`, `_`, or `-`.

Optional environment variables:

```dotenv
LOG_LEVEL=info
LOG_REQUEST_BODY=false
LOG_REQUEST_BODY_MAX_BYTES=4096
```

Set `LOG_REQUEST_BODY=true` only in controlled environments. JSON request bodies are size-limited
and sensitive fields (including passwords, tokens, secrets, and payment card data) are redacted.

## Metrics

Prometheus metrics are available at `GET /metrics` and use the `ecommerce_` prefix. HTTP route
labels use matched route templates (with numeric and UUID path segments normalized) to prevent
unbounded metric-cardinality growth. No additional metrics environment variables are required.

The endpoint includes default Node.js metrics plus HTTP latency/request counts, payment and order
business metrics, coupon outcomes, inventory operations, cache activity, and queue activity.

## Redis cache

Cache entries use a versioned key prefix: `<CACHE_NAMESPACE>:<CACHE_VERSION>:<logical-key>`. This
allows a safe cache-wide rollout invalidation by changing the version, without deleting active keys.

```dotenv
CACHE_NAMESPACE=ecommerce
CACHE_VERSION=v1
```

The cache middleware is GET-only, honors `Cache-Control: no-store`, stores JSON responses only, and
uses Redis `SCAN` plus `UNLINK` for non-blocking pattern invalidation.

## Queue worker

Run queue consumers as a separate process:

```bash
bun run worker
```

All application queues use exponential retry backoff. Jobs that exhaust their attempts are copied to
the retained `dead-letter` queue for inspection and replay. Configure retry behavior with:

```dotenv
QUEUE_ATTEMPTS=3
QUEUE_RETRY_DELAY_MS=1000
```

## Health checks

```text
GET /live   # process liveness; no dependency calls
GET /ready  # PostgreSQL, Redis, BullMQ, and Cloudinary readiness
GET /health # full dependency health summary
```

`/ready` and `/health` return `503` if any dependency is unavailable. Each dependency check is
bounded by `HEALTH_CHECK_TIMEOUT_MS` (default: `2000`).

## API reference

The OpenAPI 3.1 document is served at `GET /openapi.json`. Scalar UI is available at `GET /docs`.
Use the **Authorize** action in Scalar with a bearer access token for protected endpoints.

This project was created using `bun init` in bun v1.3.14. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.


## Admin API

All routes under `/api/v1/admin` require an authenticated `ADMIN` or `SUPER_ADMIN` user.

- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/users/:id`
- `GET /api/v1/admin/orders`
- `GET /api/v1/admin/orders/:id`
- `PATCH /api/v1/admin/orders/:id/status`
- `GET /api/v1/admin/analytics`

Order list query parameters:
`page`, `limit`, `status`, `search`, `from`, `to`.

User list query parameters:
`page`, `limit`, `search`, `role`, `isActive`.

Analytics query parameters:
`from`, `to`.

Order status transitions are intentionally validated. Paid orders cannot be moved to `CANCELLED` until a real payment-refund workflow is implemented.

## Admin intervention API

The authenticated admin API under `/api/v1/admin` now includes:

- `GET /dashboard`, `GET /analytics`
- `GET /users`, `GET /users/:id`
- `PATCH /users/:id` — update account profile/state; role escalation is restricted to `SUPER_ADMIN`
- `DELETE /users/:id` — deactivate an account (soft delete; preserves order history)
- `GET /orders`, `GET /orders/:id`, `PATCH /orders/:id/status`
- `GET /reviews`, `PATCH /reviews/:id/status`, `DELETE /reviews/:id`
- `POST /products/:productId/images`
- `PATCH /products/:productId/images/:imageId`
- `DELETE /products/:productId/images/:imageId`
- `GET /payments`
- `POST /payments/:id/refund` — full refund for eligible paid payments

Product/category/coupon/inventory/upload/notification admin operations remain protected on their existing module routes.

Refunds are provider-backed using the configured Razorpay or Stripe provider. Delivered orders are intentionally excluded until a return workflow exists.
