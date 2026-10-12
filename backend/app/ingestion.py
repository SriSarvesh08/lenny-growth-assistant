import json
from typing import List, Dict, Any
from pydantic import BaseModel, HttpUrl, Field
from .embedding import EmbeddingService

class TranscriptRecord(BaseModel):
    episode_title: str
    guest_name: str | None = None
    published_at: str | None = None
    source_url: str
    source_name: str
    content: str
    
class TranscriptChunk(BaseModel):
    chunk_index: int
    content: str
    embedding: List[float]
    metadata: Dict[str, Any]

class IngestionPipeline:
    def __init__(self, embedding_service: EmbeddingService, chunk_size: int = 1000, chunk_overlap: int = 100):
        self.embedding_service = embedding_service
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def validate_record(self, data: dict) -> TranscriptRecord:
        """Validates input data against the expected schema."""
        return TranscriptRecord(**data)

    def chunk_text(self, text: str) -> List[str]:
        """Deterministically chunk text by character length (naive approach for this milestone)."""
        if not text:
            return []
            
        chunks = []
        start = 0
        text_len = len(text)
        
        while start < text_len:
            end = min(start + self.chunk_size, text_len)
            
            # Try to snap to the nearest newline if not at the very end
            if end < text_len:
                last_newline = text.rfind('\n', start, end)
                if last_newline != -1 and last_newline > start + (self.chunk_size // 2):
                    end = last_newline + 1
                    
            chunks.append(text[start:end].strip())
            
            # Calculate next start
            next_start = end - self.chunk_overlap
            if next_start <= start or next_start >= text_len:
                # Prevent infinite loop if overlap causes lack of forward progress
                start = end
            else:
                start = next_start
                
        return [c for c in chunks if c]

    def process_transcript(self, raw_data: dict) -> tuple[TranscriptRecord, List[TranscriptChunk]]:
        """Validates, chunks, and embeds a transcript record."""
        # 1. Validate
        record = self.validate_record(raw_data)
        
        # 2. Chunk
        text_chunks = self.chunk_text(record.content)
        
        # 3. Embed
        embeddings = self.embedding_service.embed_batch(text_chunks)
        
        # 4. Construct chunk models
        chunks = []
        for i, (text, emb) in enumerate(zip(text_chunks, embeddings)):
            # Validate embedding dimension
            if len(emb) != self.embedding_service.dimension:
                raise ValueError(f"Embedding dimension mismatch. Expected {self.embedding_service.dimension}, got {len(emb)}")
                
            chunks.append(TranscriptChunk(
                chunk_index=i,
                content=text,
                embedding=emb,
                metadata={
                    "episode_title": record.episode_title,
                    "guest_name": record.guest_name,
                    "source_name": record.source_name
                }
            ))
            
        return record, chunks

    def ingest_file(self, filepath: str) -> List[tuple[TranscriptRecord, List[TranscriptChunk]]]:
        """Reads a JSONL file and processes each line."""
        results = []
        with open(filepath, 'r', encoding='utf-8') as f:
            for line_no, line in enumerate(f, 1):
                if not line.strip():
                    continue
                try:
                    data = json.loads(line)
                    results.append(self.process_transcript(data))
                except Exception as e:
                    print(f"Failed to process record on line {line_no}: {str(e)}")
                    # Continue processing other lines
        return results

    def save_to_db(self, db_conn, record: TranscriptRecord, chunks: List[TranscriptChunk]) -> bool:
        """
        Saves a transcript and its chunks to the database transactionally.
        Returns True if successful, False if it was a duplicate (safely ignored).
        """
        import psycopg2
        
        try:
            with db_conn.cursor() as cur:
                # 1. Insert transcript
                cur.execute(
                    """
                    INSERT INTO transcripts (episode_title, guest_name, published_at, source_url, source_name)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (record.episode_title, record.guest_name, record.published_at, record.source_url, record.source_name)
                )
                transcript_id = cur.fetchone()[0]
                
                # 2. Insert chunks
                for chunk in chunks:
                    cur.execute(
                        """
                        INSERT INTO transcript_chunks (transcript_id, chunk_index, content, embedding, metadata)
                        VALUES (%s, %s, %s, %s, %s)
                        """,
                        (transcript_id, chunk.chunk_index, chunk.content, chunk.embedding, json.dumps(chunk.metadata))
                    )
            
            # Commit transaction
            db_conn.commit()
            return True
            
        except psycopg2.errors.UniqueViolation:
            db_conn.rollback()
            print(f"Skipping duplicate transcript: {record.source_url}")
            return False
        except Exception as e:
            db_conn.rollback()
            print(f"Failed to save transcript {record.source_url}: {str(e)}")
            raise e
