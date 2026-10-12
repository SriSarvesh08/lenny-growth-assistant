# Data Pipeline Documentation

## 1. Overview
The Lenny Growth Assistant utilizes a custom data pipeline to ingest, chunk, and embed podcast transcripts into a PostgreSQL database equipped with `pgvector`. This document outlines the ingestion flow and data structures for Milestone 2.

## 2. Ingestion Flow
1. **File Reading**: The pipeline (`app.ingestion.IngestionPipeline`) reads local JSON/JSONL files line-by-line.
2. **Validation**: Each record is strictly validated against the `TranscriptRecord` schema (Pydantic), requiring `episode_title`, `source_url`, `source_name`, and `content`.
3. **Chunking**: Text is deterministically chunked based on a configurable `chunk_size` and `chunk_overlap`, attempting to snap to newlines for cleaner boundaries.
4. **Embedding Generation**: The pipeline calls the `EmbeddingService`, a provider-independent interface. The dimension returned by the embedding provider is validated before proceeding.
5. **Database Insertion (Planned)**: Chunks and metadata are saved to `transcripts` and `transcript_chunks` tables transactionally.

## 3. Embedding Interface
The application abstracts embeddings via `EmbeddingService`. 
- **Fake Provider**: Used for unit tests, generates deterministic vectors based on string length.
- **Local/Cloud Provider (Planned)**: Driven by `.env` variables (`EMBEDDING_PROVIDER`), allowing easy switching between Ollama and cloud APIs.

## 4. Data Provenance
Authentic source acquisition will be handled separately. Fabricated datasets must clearly be marked as synthetic test fixtures. All chunks preserve the source URL and episode title in their metadata for agent citation.
