##########
# Builder stage: compile TypeScript to dist
##########
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests and install all deps (including dev)
COPY package*.json ./
RUN npm install

# Copy source and tsconfig, then build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

##########
# Runtime stage: minimal production image with Chromium
##########
FROM node:22-alpine

# Install Chromium and dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 8080

# Run the application
CMD ["node", "dist/server.js"]
