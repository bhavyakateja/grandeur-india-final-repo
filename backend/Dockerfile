FROM oven/bun:1.2.21 AS base

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

RUN bunx prisma generate

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
CMD wget --spider -q http://localhost:3000/health || exit 1

CMD ["bun","run","src/server.ts"]