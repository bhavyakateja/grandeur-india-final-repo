import { beforeEach, describe, expect, it } from "vitest";
import app from "../src/app";
import { createAdmin, createCategory, createProduct } from "./helpers/factory";
import { prisma } from "../src/db/prisma";
import { Role } from "../src/generated/prisma/client";
import { signupAdmin, login } from "./helpers/auth";

let token: string;
let categoryId: string;

beforeEach(async () => {
  const admin = await signupAdmin();

  // Promote the signed-up user to ADMIN
  await prisma.user.update({
    where: { email: admin.email },
    data: { role: Role.ADMIN },
  });

  const loginResponse = await login(admin.email, admin.password);

  expect(loginResponse.status).toBe(200);

  const body = (await loginResponse.json()) as {
    tokens: {
      accessToken: string;
    };
  };

  token = body.tokens.accessToken;

  const category = await createCategory();
  categoryId = category.id;
});

describe("Products", () => {
    it("should list products", async () => {
        await createProduct(categoryId);

        const res = await app.request("/api/v1/products");

        expect(res.status).toBe(200);
    });

    it("should create product", async () => {
        const res = await app.request("/api/v1/products", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: "Gaming Laptop",
                description: "Gaming Laptop for testing",
                price: 80000,
                stock: 5,
                categoryId,
            }),
        });

        expect(res.status).toBe(201);
    });

    it("should update product", async () => {
        const product = await createProduct(categoryId);

        const res = await app.request(`/api/v1/products/${product.id}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                price: 90000,
            }),
        });

        expect(res.status).toBe(200);
    });

    it("should delete product", async () => {
        const product = await createProduct(categoryId);

        const res = await app.request(`/api/v1/products/${product.id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        expect(res.status).toBe(200);
    });
});