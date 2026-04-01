FROM rust:1.85-slim AS builder

WORKDIR /src

COPY Cargo.toml ./
COPY src ./src

RUN cargo build --release

FROM debian:bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /src/target/release/alignment /usr/local/bin/alignment
COPY --from=builder /src/target/release/alignment-server /usr/local/bin/alignment-server

ENTRYPOINT ["alignment"]
