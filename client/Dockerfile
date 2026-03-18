FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* /app/
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . /app

EXPOSE 3000

CMD ["bash", "-lc", "npm run dev -- --hostname 0.0.0.0 --port 3000"]