import pytest
import psycopg2
from app.ingestion import IngestionPipeline
from app.embedding import FakeEmbeddingService

DB_CONFIG = {
    "dbname": "lenny_assistant",
    "user": "postgres",
    "password": "postgres",
    "host": "localhost",
    "port": "5433"
}

@pytest.fixture
def db_conn():
    conn = psycopg2.connect(**DB_CONFIG)
    yield conn
    # Cleanup test records
    with conn.cursor() as cur:
        cur.execute("DELETE FROM transcripts WHERE source_name = 'Synthetic Test Source'")
    conn.commit()
    conn.close()

def test_db_objects_exist(db_conn):
    with db_conn.cursor() as cur:
        # Check vector extension
        cur.execute("SELECT extname FROM pg_extension WHERE extname = 'vector'")
        assert cur.fetchone() is not None
        
        # Check tables
        cur.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
        tables = [r[0] for r in cur.fetchall()]
        assert "transcripts" in tables
        assert "transcript_chunks" in tables

def test_ingestion_and_duplicates(db_conn):
    # Fake embedding must match DB constraint of 768 dimension
    pipeline = IngestionPipeline(FakeEmbeddingService(dimension=768), chunk_size=50, chunk_overlap=10)
    
    test_data = {
        "episode_title": "Synthetic Test Episode",
        "source_url": "https://example.com/synthetic-test",
        "source_name": "Synthetic Test Source",
        "content": "This is synthetic test data for integration verification. " * 5
    }
    
    # 1. Process
    record, chunks = pipeline.process_transcript(test_data)
    
    # 2. Save
    success = pipeline.save_to_db(db_conn, record, chunks)
    assert success is True
    
    # 3. Verify saved data
    with db_conn.cursor() as cur:
        cur.execute("SELECT id FROM transcripts WHERE source_url = %s", (record.source_url,))
        t_id = cur.fetchone()[0]
        
        cur.execute("SELECT count(*) FROM transcript_chunks WHERE transcript_id = %s", (t_id,))
        count = cur.fetchone()[0]
        assert count == len(chunks)
        
    # 4. Verify duplicate insertion fails gracefully
    success2 = pipeline.save_to_db(db_conn, record, chunks)
    assert success2 is False

def test_transactional_rollback(db_conn):
    pipeline = IngestionPipeline(FakeEmbeddingService(dimension=768), chunk_size=50, chunk_overlap=10)
    
    test_data = {
        "episode_title": "Synthetic Test Rollback",
        "source_url": "https://example.com/synthetic-rollback",
        "source_name": "Synthetic Test Source",
        "content": "Rollback test content"
    }
    
    record, chunks = pipeline.process_transcript(test_data)
    
    # Introduce error: change embedding dimension so PostgreSQL rejects it
    chunks[0].embedding = [0.0] * 10
    
    # Should raise error and rollback
    with pytest.raises(psycopg2.errors.DataException):
        pipeline.save_to_db(db_conn, record, chunks)
        
    # Ensure neither transcript nor chunks were saved
    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM transcripts WHERE source_url = %s", (record.source_url,))
        assert cur.fetchone()[0] == 0
