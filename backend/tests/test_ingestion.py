import pytest
from app.ingestion import IngestionPipeline
from app.embedding import FakeEmbeddingService
from pydantic import ValidationError

def test_transcript_schema_validation():
    pipeline = IngestionPipeline(FakeEmbeddingService())
    
    # Valid record
    valid_data = {
        "episode_title": "Test Episode",
        "source_url": "https://example.com/test",
        "source_name": "Test Source",
        "content": "This is the transcript content."
    }
    record = pipeline.validate_record(valid_data)
    assert record.episode_title == "Test Episode"
    
    # Missing required field
    invalid_data = {
        "episode_title": "Test Episode",
        # Missing source_url
        "source_name": "Test Source",
        "content": "Content"
    }
    with pytest.raises(ValidationError):
        pipeline.validate_record(invalid_data)

def test_deterministic_chunking():
    pipeline = IngestionPipeline(FakeEmbeddingService(), chunk_size=50, chunk_overlap=10)
    text = "A" * 50 + "B" * 50
    chunks = pipeline.chunk_text(text)
    
    # We expect chunk 1 to be 50 A's.
    # Chunk 2 starts at index 40 (overlap 10). So it contains 10 A's and 40 B's.
    # Chunk 3 starts at index 80 (overlap 10 from 90). So it contains 20 B's.
    assert chunks[0] == "A" * 50
    assert chunks[1] == "A" * 10 + "B" * 40
    assert chunks[2] == "B" * 20

def test_empty_or_malformed_transcript():
    pipeline = IngestionPipeline(FakeEmbeddingService())
    valid_data = {
        "episode_title": "Test Episode",
        "source_url": "https://example.com/test",
        "source_name": "Test Source",
        "content": ""  # Empty content
    }
    record, chunks = pipeline.process_transcript(valid_data)
    assert len(chunks) == 0

def test_process_transcript_with_fake_embeddings():
    service = FakeEmbeddingService(dimension=10)
    pipeline = IngestionPipeline(service, chunk_size=10, chunk_overlap=0)
    
    data = {
        "episode_title": "Test",
        "source_url": "https://example.com",
        "source_name": "Source",
        "content": "1234567890abcdefghij"
    }
    
    record, chunks = pipeline.process_transcript(data)
    
    assert len(chunks) == 2
    assert chunks[0].chunk_index == 0
    assert chunks[0].content == "1234567890"
    assert len(chunks[0].embedding) == 10
    
    assert chunks[1].chunk_index == 1
    assert chunks[1].content == "abcdefghij"

def test_embedding_dimension_validation():
    # Create a broken fake service that returns wrong dimensions
    class BrokenFakeService(FakeEmbeddingService):
        def embed_batch(self, texts):
            # Return wrong dimension (5 instead of 10)
            return [[0.0] * 5 for _ in texts]
            
    service = BrokenFakeService(dimension=10)
    pipeline = IngestionPipeline(service)
    
    data = {
        "episode_title": "Test",
        "source_url": "https://example.com",
        "source_name": "Source",
        "content": "Some content here."
    }
    
    with pytest.raises(ValueError, match="Embedding dimension mismatch"):
        pipeline.process_transcript(data)
