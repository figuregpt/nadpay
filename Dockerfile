FROM node:18-alpine

# Install PM2 globally
RUN npm install -g pm2

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with optimizations
RUN npm ci --prefer-offline --no-audit --no-fund

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove devDependencies after build
RUN npm prune --production

# Create log directory for finalizer
RUN mkdir -p /app/logs

# Expose port (Railway will set PORT dynamically)
EXPOSE ${PORT:-3000}

# Start both web app and finalizer using PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"] 