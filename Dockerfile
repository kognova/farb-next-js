FROM node:21 AS builder

WORKDIR /app

COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY package.json .

RUN yarn install

COPY . .

RUN yarn build

# Use a smaller Node.js image for the final stage
FROM node:21-slim

ENV NEST_HOST=fly-local-6pn
ENV PORT=8080

WORKDIR /app

# Copy the built application and dependencies from the builder stage
COPY --from=builder /app ./

EXPOSE 8080

# The container will be ready to run the commands specified in the fly.toml file
CMD ["sh", "-c", "echo 'Container is ready' && tail -f /dev/null"]