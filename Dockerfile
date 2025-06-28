FROM node:18-alpine

# Install PM2 globally
RUN npm install -g pm2

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove devDependencies after build
RUN npm prune --production

# Expose port (Railway will set PORT dynamically)
EXPOSE ${PORT:-3000}

# Start both web app and finalizer using PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"] 