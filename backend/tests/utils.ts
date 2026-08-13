export function randomEmail() {
  return `user-${crypto.randomUUID()}@test.com`;
}