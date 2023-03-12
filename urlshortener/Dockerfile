FROM rust:1.68 as builder
WORKDIR /usr/src/myapp
COPY . .
RUN cargo install --path .
FROM debian:bullseye-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /usr/local/cargo/bin/urlshortener /usr/local/bin/urlshortener
COPY --from=builder /usr/src/myapp/Rocket.toml .
CMD ["urlshortener"]
