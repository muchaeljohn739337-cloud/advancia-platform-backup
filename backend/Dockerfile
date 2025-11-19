FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (use npm install as fallback for workspace issues)
RUN npm install --legacy-peer-deps || npm ci --legacy-peer-deps || npm install

# Copy source and Prisma schema
COPY src ./src
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --production --legacy-peer-deps || npm ci --only=production --legacy-peer-deps

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Use ts-node for development compatibility
CMD ["npx", "ts-node", "src/index.ts"]