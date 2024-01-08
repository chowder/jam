# Build frontend
FROM node:14 as frontend
WORKDIR /app

COPY static/package.json .
COPY static/package-lock.json .
RUN npm install

COPY static .
RUN npm run build

# Build server
FROM golang:1.21.3 as app
WORKDIR /usr/src/app

COPY go.mod go.sum ./
RUN go mod download && go mod verify

COPY . .
COPY --from=frontend /app/dist ./static/
RUN go build

# Runtime image
FROM debian:bookworm-slim
WORKDIR /app
COPY --from=app /usr/src/app/jam .
ENTRYPOINT ["./jam", "-addr", "0.0.0.0:80"]
