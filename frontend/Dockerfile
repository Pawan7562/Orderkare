# Multi-stage production build for OrderKare Frontend
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Set default production API base URL at build time (can be overridden)
ARG VITE_API_URL=https://orderkare-3.onrender.com/api/v1
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Production web server
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
