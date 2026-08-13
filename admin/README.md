# Grandeur India Admin Frontend

Production admin dashboard wired to the Grandeur India backend.

## Backend contract used

The dashboard uses the backend API under `/api/v1`:

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /admin/dashboard`
- `GET /admin/analytics`
- `GET /admin/users`
- `GET /admin/users/:id`
- `GET /admin/orders`
- `GET /admin/orders/:id`
- `PATCH /admin/orders/:id/status`
- `GET/POST/PUT/DELETE /products`
- `GET/POST/PUT/DELETE /categories`
- `GET/PATCH /inventory/:productId`

The frontend does not invent endpoints for capabilities that the backend does not expose. Customer/user management is therefore read-only, while order status, products, categories, and inventory use the actual supported mutations.

## Setup

```bash
bun install
```

Create `.env`:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

For production, set `VITE_API_URL` to the deployed backend `/api/v1` URL.

## Run

```bash
bun dev
```

## Build

```bash
bun run build
```

## Production notes

- Refresh tokens remain in the backend-managed HttpOnly cookie.
- The admin frontend keeps only the short-lived access token in memory.
- Backend RBAC remains authoritative.
- No backend secrets belong in this frontend.
- Destructive product/category actions require confirmation.
- Order status changes are limited to transitions accepted by the backend.
- Paid orders are not presented with a fake refund/cancellation flow.
- Product image records are displayed when returned by the backend; the current backend does not expose a product-image attachment mutation, so the admin UI does not pretend that it can attach images.
