FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit
COPY . .
# Set NODE_ENV to production for build
ENV NODE_ENV=production
RUN npm run build || (echo "Build failed!" && ls -la && exit 1)
# Verify .next directory exists
RUN if [ ! -d .next ]; then echo ".next directory not found!"; ls -la; exit 1; fi
RUN echo "Build successful, .next contents:" && ls -la .next/

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy only necessary files from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.js ./next.config.js

EXPOSE 3000
CMD ["npm", "start"]
