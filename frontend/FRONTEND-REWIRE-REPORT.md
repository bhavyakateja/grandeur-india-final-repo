# Grandeur India Customer Frontend — Backend Rewire Report

## Runtime and build

- React 19 + TypeScript.
- Bun native runtime/dev server and `Bun.build()` are retained.
- `bun-plugin-tailwind` remains the Tailwind build plugin.
- No Vite, Vite config, or Vite dependency was introduced.
- The existing `build.ts` remains the production bundler entry.
- Browser API configuration uses `BUN_PUBLIC_API_URL`.

## Backend contract

The customer application is wired to the supplied `/api/v1` backend:

- authentication: `/auth/signup`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`
- catalogue: `/products`, `/products/:id`, `/categories`, `/categories/:id`
- customer state: `/cart`, `/wishlist`, `/addresses`
- orders: `/orders`, `/orders/:id`, `/orders/:id/cancel`
- checkout/payments: `/checkout`, `/payments/create-order`, `/payments/verify`
- coupons: `/coupons/apply`
- reviews: `/reviews`, `/reviews/product/:productId`

Authentication uses the backend HttpOnly refresh cookie and an in-memory access token. A protected request that receives 401 performs one refresh attempt before failing.

## UI cleanup

- Removed the moving/promotional banner above the header.
- Reduced the global content offset to match the new header height.
- Kept the existing Grandeur visual system and reusable Radix/shadcn-style UI components.
- Removed the old demo product data module; price formatting now lives in the shared utility layer.
- Product, cart, wishlist, address, order, review and checkout state are backed by React Query/API state rather than a local shadow catalogue.

## Important backend limitations respected

The customer frontend does not invent APIs for:

- refunds
- review moderation
- admin user management
- product-image attachment management

Those belong to the future admin frontend/backend work.

## Environment

Copy `.env.example` to `.env` and set:

`BUN_PUBLIC_API_URL=http://localhost:3000/api/v1`

Only public frontend configuration belongs in this variable. Never put JWT secrets, database credentials, Razorpay secret keys, or Cloudinary secrets in the frontend.
