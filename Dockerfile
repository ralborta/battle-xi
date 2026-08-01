FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Toolkit mínimo para aplicar migraciones al arrancar el contenedor: el runtime
# usa el output standalone, que no incluye el CLI de Prisma.
FROM node:22-alpine AS migrator
WORKDIR /migrator
RUN npm init -y > /dev/null && npm install --no-audit --no-fund prisma@7.9.1 dotenv
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    DATABASE_URL=postgresql://build:build@localhost:5432/build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=migrator /migrator /migrator
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["/bin/sh", "-c", "cd /migrator && ./node_modules/.bin/prisma migrate deploy && cd /app && node server.js"]
