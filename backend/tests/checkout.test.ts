import { beforeEach, describe, expect, it } from "vitest";

import app from "../src/app";

import { prisma } from "../src/db/prisma";
import { Role } from "../src/generated/prisma/client";

import { signupAdmin, login } from "./helpers/auth";
import { createCategory } from "./helpers/category";
import { createProduct } from "./helpers/product";

let token: string;
let productId: string;
let addressId: string;

beforeEach(async () => {
  const user = await signupAdmin();

  await prisma.user.update({
    where: {
      email: user.email,
    },
    data: {
      role: Role.USER,
    },
  });

  const loginResponse = await login(
    user.email,
    user.password
  );

  expect(loginResponse.status).toBe(200);

  const loginBody = (await loginResponse.json()) as {
    tokens: {
      accessToken: string;
    };
  };

  token = loginBody.tokens.accessToken;

  const category = await createCategory();

  const product = await createProduct(category.id);

  productId = product.id;

  const addressResponse = await app.request("/api/v1/addresses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fullName: "Bhavya Kateja",
      phone: "9876543210",
      addressLine1: "123 Test Street",
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      postalCode: "560001",
      isDefault: true,
    }),
  });

  expect(addressResponse.status).toBe(201);

  const address = (await addressResponse.json()) as {
    id: string;
  };

  addressId = address.id;

  const cartResponse = await app.request("/api/v1/cart", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productId,
      quantity: 2,
    }),
  });

  expect(cartResponse.status).toBe(201);
});

describe("Checkout", () => {
  it("should reject unauthenticated checkout", async () => {
    const response = await app.request("/api/v1/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        addressId,
      }),
    });

    expect(response.status).toBe(401);
  });

  it("should checkout successfully", async () => {
    const response = await app.request("/api/v1/checkout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        addressId,
      }),
    });

    expect(response.status).toBe(200);

    const body = await response.json() as {
      addressId: string;
      items: unknown[];
      subtotal: string;
      tax: string;
      total: string;
    };

    expect(body.addressId).toBe(addressId);
    expect(body.items.length).toBe(1);

    expect(Number(body.subtotal)).toBeGreaterThan(0);
    expect(Number(body.tax)).toBeGreaterThan(0);
    expect(Number(body.total)).toBeGreaterThan(0);
  });
});