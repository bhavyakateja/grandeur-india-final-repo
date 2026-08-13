# Grandeur India Frontend — Production Integration Notes

This frontend is wired to the backend API under `/api/v1`.

## Runtime configuration

Set `BUN_PUBLIC_API_URL` to the public backend base URL, for example:

`https://api.example.com/api/v1`

Do not put JWT secrets, database credentials, Razorpay secret keys, Cloudinary secrets, or other private credentials in this frontend.

## Authentication

- Login/signup receive an access token.
- Refresh tokens remain in the backend-managed HttpOnly cookie.
- Authenticated requests use `Authorization: Bearer <accessToken>`.
- A 401 response triggers one refresh attempt and retries the original request.

## Payments

The checkout flow uses the backend `/payments/create-order` endpoint and the public Razorpay key returned by that endpoint. The frontend never contains the Razorpay secret. Payment verification is performed through `/payments/verify`; an order is only considered confirmed after backend verification.

## Backend source-of-truth decisions

The frontend does not invent MRP, discounts, shipping, tax, stock, certification, return, or bestseller data. Product listing consumes `{ products, total }` from the backend. Checkout pricing is calculated by the backend.

## Admin

The uploaded frontend archive did not contain a separate admin application/dashboard. This archive therefore does not claim to have rewired an admin UI that was not present in the supplied source. The backend does expose `/admin` endpoints; a separate admin frontend can be wired against those contracts without changing this customer storefront.
