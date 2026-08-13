# Grandeur India Admin — Production Rewire Report

## Implemented

### Authentication / security
- Admin login uses the real `/api/v1/auth/login` endpoint.
- Session restoration uses the real `/api/v1/auth/refresh` endpoint and backend HttpOnly refresh cookie.
- Access token is kept in memory only.
- Non-admin accounts are rejected.
- API 401 responses attempt one refresh/retry.
- 403 responses are surfaced as authorization errors.
- No secrets are embedded in the frontend.

### Dashboard
- Live KPIs from `/admin/dashboard`.
- Recent orders.
- Order status distribution.
- Top-selling products.
- Loading, empty, error and retry states.

### Products
- Real backend product listing with search, category, status, sorting and pagination.
- Create product.
- Edit product.
- Delete product with confirmation.
- Existing backend product images are displayed.
- Product status and stock are shown from backend data.
- No fake MRP, discount, or product data.
- Product fields match the backend create/update schema.

### Categories
- Search/list categories.
- Create category.
- Edit category.
- Activate/deactivate category.
- Delete category with confirmation.
- Slugs are treated as backend-generated values.

### Orders
- Search and status filtering.
- Pagination.
- Order details.
- Customer/order item/payment information.
- Status updates.
- Only backend-supported status transitions are offered:
  - PENDING -> CONFIRMED/CANCELLED
  - CONFIRMED -> SHIPPED/CANCELLED
  - SHIPPED -> DELIVERED
- The UI does not invent refunds.

### Customers
- Search/filter/pagination.
- Customer details.
- Role, account status, verification and activity counts.
- Read-only because the current backend admin module does not expose user update/delete routes.

### Inventory
- Product stock view.
- Search/pagination.
- Stock update through `/inventory/:productId`.
- Non-negative integer validation.

### Analytics
- Real `/admin/analytics` data.
- Date range.
- Sales-by-day table.
- Backend KPIs and top-selling data.

## Backend limitations intentionally respected

The supplied backend currently does not expose:
- Admin user update/delete endpoints.
- Admin review moderation endpoints.
- Product image attachment/update endpoints.
- Refund endpoints.

The frontend does not fake these capabilities.

## Verification

The source was statically rewired against the supplied backend source and its actual routes/schemas. This environment does not have Bun installed, so a local `bun run build` could not be executed here.

Run after extraction:

```bash
bun install
bun run build
```
