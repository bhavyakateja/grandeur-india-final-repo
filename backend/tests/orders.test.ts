import { beforeEach, describe, expect, it } from "vitest";

import app from "../src/app";
import { prisma } from "../src/db/prisma";
import { Role } from "../src/generated/prisma/client";

import { signupAdmin, login } from "./helpers/auth";
import { createCategory } from "./helpers/category";
import { createProduct } from "./helpers/product";
import { createOrder } from "./helpers/order";

let token: string;
let userId: string;
let orderId: string;

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

  const dbUser = await prisma.user.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  userId = dbUser.id;

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

  const order = await createOrder(
    userId,
    product.id
  );

  orderId = order.id;
});

describe("Orders", () => {
  it("should get my orders", async () => {
    const response = await app.request("/api/v1/orders", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(200);

    const body = (await response.json()) as unknown[];

    expect(body.length).toBeGreaterThan(0);
  });

  it("should get order by id", async () => {
    const response = await app.request(
      `/api/v1/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      id: string;
    };

    expect(body.id).toBe(orderId);
  });

  it("should cancel pending unpaid order", async () => {
    const response = await app.request(
      `/api/v1/orders/${orderId}/cancel`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      status: string;
    };

    expect(body.status).toBe("CANCELLED");
  });

  it("should reject unauthenticated access", async () => {
    const response = await app.request("/api/v1/orders");

    expect(response.status).toBe(401);
  });
});