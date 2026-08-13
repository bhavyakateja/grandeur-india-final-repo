import { describe, expect, it } from "vitest";
import app from "../src/app";

// 1. Define the expected shape of your response
type AuthResponse = {
  user: {
    email: string;
    [key: string]: any;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
};

describe("Authentication", () => {
  it("should signup successfully", async () => {
    const res = await app.request("/api/v1/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Bhavya",
        email: "bhavya@test.com",
        password: "Password@123",
      }),
    });

    expect(res.status).toBe(201);

    // 2. Assert the type of the JSON body here
    const body = (await res.json()) as AuthResponse;

    expect(body.user).toBeDefined();
    expect(body.tokens).toBeDefined();
    expect(body.tokens.accessToken).toBeDefined();
    expect(body.tokens.refreshToken).toBeDefined();
  });

  it("should login successfully", async () => {
    await app.request("/api/v1/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Bhavya",
        email: "bhavya@test.com",
        password: "Password@123",
      }),
    });

    const res = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "bhavya@test.com",
        password: "Password@123",
      }),
    });

    expect(res.status).toBe(200);

    // 3. Assert the type here as well
    const body = (await res.json()) as AuthResponse;

    expect(body.user.email).toBe("bhavya@test.com");
    expect(body.tokens.accessToken).toBeDefined();
  });

  it("should reject invalid password", async () => {
    await app.request("/api/v1/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Bhavya",
        email: "bhavya@test.com",
        password: "Password@123",
      }),
    });

    const res = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "bhavya@test.com",
        password: "WrongPassword123",
      }),
    });

    expect(res.status).toBe(401);
  });
});

import { randomEmail } from "./utils";

const email = randomEmail();

await app.request("/api/v1/auth/signup", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "Bhavya",
    email,
    password: "Password@123",
  }),
});