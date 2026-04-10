FROM node:20-alpine

# better-sqlite3 is een native module — buildtools zijn nodig tijdens npm install
RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package.json .
RUN npm install --production

COPY server.js db.js ./
COPY services/ ./services/
COPY public/ ./public/

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD node -e "require('http').get('http://localhost/',r=>r.statusCode===200?process.exit(0):process.exit(1)).on('error',()=>process.exit(1))"
CMD ["node", "server.js"]
