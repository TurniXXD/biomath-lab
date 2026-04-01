# Alignment

Learning-oriented sequence alignment crate.

## Scope

This crate is intentionally narrow. It is meant to teach the mechanics of
classic sequence alignment algorithms without trying to replace BLAST or a
production bioinformatics pipeline.

## Roadmap

### Stage 1

- Needleman-Wunsch for global alignment
- Smith-Waterman for local alignment

### Stage 2

- Affine gap penalties
- Traceback reconstruction
- Simple FASTA parsing
- Scoring customization

### Stage 3

- Banded alignment
- k-mer seeding
- Simple heuristics
- Benchmarking against existing tools

## Layout

- `src/algorithms/needleman_wunsch.rs`
- `src/algorithms/smith_waterman.rs`
- `src/fasta.rs`
- `src/scoring.rs`
- `src/result.rs`
- `src/main.rs`

## Usage

The CLI currently accepts a sequence pair and prints either a global or local
alignment. Optional flags let you override the default scoring model:

- `--match N`
- `--mismatch N`
- `--gap N`

The crate also exposes a tiny HTTP service binary for the main FastAPI server.
It listens on `ALIGNMENT_BIND_ADDR` and serves:

- `GET /health`
- `POST /align`
