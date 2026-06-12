# --- Build Stage ---
FROM node:24-alpine AS builder

WORKDIR /workspace

# Copy package descriptors
COPY package*.json ./

# Install npm dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Vite static assets
RUN npm run build

# --- Serve Stage ---
FROM nginx:alpine

# Copy custom Nginx configuration if needed, otherwise use default
# Copy compiled static assets from builder stage
COPY --from=builder /workspace/dist /usr/share/nginx/html

# Expose Nginx port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
