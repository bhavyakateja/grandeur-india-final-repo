import app from "../../src/app";

export async function signupAdmin() {
  const email = `admin-${crypto.randomUUID()}@test.com`;
  const password = "Password@123";

  const signup = await app.request("/api/v1/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Admin",
      email,
      password,
    }),
  });

  if (signup.status !== 201) {
    throw new Error(`Signup failed (${signup.status})`);
  }

  return { email, password };
}

export async function login(email: string, password: string) {
  return app.request("/api/v1/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
}