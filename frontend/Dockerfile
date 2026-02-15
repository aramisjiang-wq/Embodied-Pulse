FROM node:20-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_TIMEOUT
ARG NEXT_PUBLIC_API_RETRIES
ARG NEXT_PUBLIC_API_DEBUG

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_API_TIMEOUT=${NEXT_PUBLIC_API_TIMEOUT:-30000}
ENV NEXT_PUBLIC_API_RETRIES=${NEXT_PUBLIC_API_RETRIES:-1}
ENV NEXT_PUBLIC_API_DEBUG=${NEXT_PUBLIC_API_DEBUG:-false}

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine AS runner

WORKDIR /usr/share/nginx/html

COPY nginx.conf /etc/nginx/nginx.conf

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

ENV PORT=80
ENV HOST=0.0.0.0

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
