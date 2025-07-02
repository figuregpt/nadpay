# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Copy package files only
COPY package*.json ./

# Install dependencies with cache mount for faster builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production

# Stage 2: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
# Use cache mount and parallel installation
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --no-fund

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 3: Production
FROM node:18-alpine AS runner
WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

# Copy necessary files from previous stages
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/ecosystem.config.js ./
COPY --from=builder /app/finalizer-v7-ultra-fast.js ./

# Copy other necessary files
COPY contracts ./contracts
COPY *.abi.json ./

# Create log directory for finalizer
RUN mkdir -p /app/logs

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port (Railway will set PORT dynamically)
EXPOSE ${PORT:-3000}

# Start both web app and finalizer using PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"] 