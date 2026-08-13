export function randomEmail() {
  return `user-${crypto.randomUUID()}@test.com`;
}

export function randomSlug(prefix = "item") {
  return `${prefix}-${crypto.randomUUID()}`;
}