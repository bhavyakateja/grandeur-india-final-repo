import { vi } from "vitest";
import { beforeEach, describe, expect, it } from "vitest";

import app from "../src/app";
import { prisma } from "../src/db/prisma";
import { Role } from "../src/generated/prisma/client";

import { signupAdmin, login } from "./helpers/auth";
import { createCategory } from "./helpers/category";
import { createProduct } from "./helpers/product";

let token: string;
let addressId: string;

vi.mock("../src/modules/payment/gateway", () => ({
  paymentProvider: "RAZORPAY",

  paymentGateway: {
    createOrder: vi.fn().mockResolvedValue({
      id: "order_test_123",
    }),

    verify: vi.fn().mockResolvedValue(true),
  },
}));

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

  const loginResponse = await login(user.email, user.password);

  expect(loginResponse.status).toBe(200);

  const loginBody = (await loginResponse.json()) as {
    tokens: {
      accessToken: string;
    };
  };

  token = loginBody.tokens.accessToken;

  const category = await createCategory();
  const product = await createProduct(category.id);

  const addressResponse = await app.request("/api/v1/addresses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fullName: "Bhavya",
      phone: "9876543210",
      addressLine1: "123 Test Street",
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      postalCode: "560001",
      isDefault: true,
    }),
  });

  const address = await addressResponse.json() as { id: string };

  addressId = address.id;

  await app.request("/api/v1/cart", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productId: product.id,
      quantity: 1,
    }),
  });
});

describe("Payments", () => {
  it("should create payment order", async () => {
    const response = await app.request("/api/v1/payments/create-order", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        addressId,
      }),
    });

    expect(response.status).toBe(201);

    const body = await response.json() as {
      paymentId: string;
      providerOrderId: string;
      amount: string;
    };

    expect(body.paymentId).toBeDefined();
    expect(body.providerOrderId).toBeDefined();
    expect(Number(body.amount)).toBeGreaterThan(0);
  });

  it("should reject unauthenticated payment creation", async () => {
    const response = await app.request("/api/v1/payments/create-order", {
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
});