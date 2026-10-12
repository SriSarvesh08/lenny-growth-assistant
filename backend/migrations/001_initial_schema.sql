CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS transcripts (
    id SERIAL PRIMARY KEY,
    episode_title VARCHAR(255) NOT NULL,
    guest_name VARCHAR(255),
    published_at DATE,
    source_url VARCHAR(512) NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    ingestion_status VARCHAR(50) NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_source_url UNIQUE (source_url)
);

-- Note: The vector dimension is set to 768 to match nomic-embed-text.
-- This can be modified via migration if a different model is selected.
CREATE TABLE IF NOT EXISTS transcript_chunks (
    id SERIAL PRIMARY KEY,
    transcript_id INTEGER NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER,
    embedding vector(768),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_chunk_index_per_transcript UNIQUE (transcript_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_transcript_chunks_embedding ON transcript_chunks USING hnsw (embedding vector_cosine_ops);
