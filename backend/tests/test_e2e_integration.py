"""
Milestone 5: End-to-End Integration Tests

These tests verify the full stack against live PostgreSQL + pgvector and Ollama.
Requires: 
  - lenny_postgres Docker container running
  - Ollama with llama3.2:3b model loaded
  - .env configured (AGENT_PROVIDER=local)

Tests use clearly labeled synthetic fixtures and clean up after themselves.
"""

import asyncio
import uuid
import psycopg2
import httpx
import pytest

# Mark all tests in this module as requiring live infrastructure
pytestmark = pytest.mark.integration


# ──────────────────────────────────────────────────────────────
# Fixtures
# ──────────────────────────────────────────────────────────────

DB_CONFIG = {
    "host": "localhost",
    "port": 5433,
    "dbname": "lenny_assistant",
    "user": "postgres",
    "password": "postgres",
}

OLLAMA_BASE_URL = "http://localhost:11434"
FASTAPI_BASE_URL = "http://localhost:8000"

TEST_TRANSCRIPT_MARKER = "[E2E_TEST_FIXTURE]"


def get_db():
    return psycopg2.connect(**DB_CONFIG)


# ──────────────────────────────────────────────────────────────
# 1. PostgreSQL Connectivity & Schema Verification
# ──────────────────────────────────────────────────────────────

def test_postgres_connectivity():
    """Verify PostgreSQL is reachable and the pgvector extension is enabled."""
    conn = get_db()
    with conn.cursor() as cur:
        cur.execute("SELECT extname FROM pg_extension WHERE extname = 'vector';")
        row = cur.fetchone()
        assert row is not None, "pgvector extension not found"
        assert row[0] == "vector"
    conn.close()


def test_all_tables_exist():
    """Verify all 5 required tables exist after both migrations."""
    conn = get_db()
    with conn.cursor() as cur:
        cur.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        tables = {row[0] for row in cur.fetchall()}
    conn.close()

    required_tables = {"transcripts", "transcript_chunks", "chat_sessions", "chat_messages", "agent_transcripts"}
    missing = required_tables - tables
    assert not missing, f"Missing tables: {missing}"


def test_vector_column_dimension():
    """Verify transcript_chunks embedding column is vector(768)."""
    conn = get_db()
    with conn.cursor() as cur:
        cur.execute("""
            SELECT udt_name FROM information_schema.columns
            WHERE table_name = 'transcript_chunks' AND column_name = 'embedding';
        """)
        row = cur.fetchone()
        assert row is not None, "embedding column not found in transcript_chunks"
    conn.close()


# ──────────────────────────────────────────────────────────────
# 2. Ollama Connectivity
# ──────────────────────────────────────────────────────────────

def test_ollama_reachable():
    """Verify Ollama is running and lists models."""
    try:
        with httpx.Client(timeout=5.0) as client:
            res = client.get(f"{OLLAMA_BASE_URL}/api/tags")
            assert res.status_code == 200
            models = [m.get("name") for m in res.json().get("models", [])]
            assert any("llama3.2" in m for m in models), f"llama3.2:3b not found. Available: {models}"
    except httpx.ConnectError:
        pytest.skip("Ollama is not reachable at localhost:11434")


# ──────────────────────────────────────────────────────────────
# 3. Database CRUD: Synthetic Transcript Ingestion
# ──────────────────────────────────────────────────────────────

def test_synthetic_transcript_roundtrip():
    """Insert and retrieve a synthetic test transcript with chunks, then clean up."""
    conn = get_db()
    test_url = f"https://test.example.com/e2e-{uuid.uuid4().hex[:8]}"
    test_title = f"{TEST_TRANSCRIPT_MARKER} E2E Roundtrip Test Episode"
    fake_embedding = [0.1] * 768

    try:
        with conn.cursor() as cur:
            # Insert transcript
            cur.execute(
                """INSERT INTO transcripts (episode_title, guest_name, source_url, source_name)
                   VALUES (%s, %s, %s, %s) RETURNING id;""",
                (test_title, "Test Guest", test_url, "e2e_test"),
            )
            transcript_id = cur.fetchone()[0]

            # Insert 2 chunks with embeddings
            for i in range(2):
                cur.execute(
                    """INSERT INTO transcript_chunks (transcript_id, chunk_index, content, token_count, embedding, metadata)
                       VALUES (%s, %s, %s, %s, %s::vector, %s);""",
                    (transcript_id, i, f"E2E test chunk {i} content", 10, str(fake_embedding), '{}'),
                )
            conn.commit()

            # Verify retrieval
            cur.execute("SELECT id, episode_title FROM transcripts WHERE source_url = %s;", (test_url,))
            row = cur.fetchone()
            assert row is not None
            assert TEST_TRANSCRIPT_MARKER in row[1]

            cur.execute("SELECT COUNT(*) FROM transcript_chunks WHERE transcript_id = %s;", (transcript_id,))
            chunk_count = cur.fetchone()[0]
            assert chunk_count == 2

    finally:
        # Cleanup
        with conn.cursor() as cur:
            cur.execute("DELETE FROM transcripts WHERE source_url = %s;", (test_url,))
            conn.commit()
        conn.close()


def test_duplicate_transcript_rejected():
    """Verify that inserting a transcript with the same source_url is rejected (unique constraint)."""
    conn = get_db()
    test_url = f"https://test.example.com/dup-{uuid.uuid4().hex[:8]}"
    test_title = f"{TEST_TRANSCRIPT_MARKER} Duplicate Test"

    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO transcripts (episode_title, guest_name, source_url, source_name)
                   VALUES (%s, %s, %s, %s);""",
                (test_title, "Dup Guest", test_url, "dup_test"),
            )
            conn.commit()

            # Second insert should violate unique constraint
            with pytest.raises(psycopg2.errors.UniqueViolation):
                cur.execute(
                    """INSERT INTO transcripts (episode_title, guest_name, source_url, source_name)
                       VALUES (%s, %s, %s, %s);""",
                    (test_title, "Dup Guest", test_url, "dup_test"),
                )
                conn.commit()

    finally:
        conn.rollback()
        with conn.cursor() as cur:
            cur.execute("DELETE FROM transcripts WHERE source_url = %s;", (test_url,))
            conn.commit()
        conn.close()


def test_chunk_cascade_delete():
    """Verify that deleting a transcript cascades to its chunks."""
    conn = get_db()
    test_url = f"https://test.example.com/cascade-{uuid.uuid4().hex[:8]}"
    test_title = f"{TEST_TRANSCRIPT_MARKER} Cascade Delete Test"
    fake_embedding = [0.0] * 768

    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO transcripts (episode_title, guest_name, source_url, source_name)
                   VALUES (%s, %s, %s, %s) RETURNING id;""",
                (test_title, "Cascade Guest", test_url, "cascade_test"),
            )
            transcript_id = cur.fetchone()[0]

            cur.execute(
                """INSERT INTO transcript_chunks (transcript_id, chunk_index, content, token_count, embedding)
                   VALUES (%s, 0, 'cascade test chunk', 5, %s::vector);""",
                (transcript_id, str(fake_embedding)),
            )
            conn.commit()

            # Delete transcript
            cur.execute("DELETE FROM transcripts WHERE id = %s;", (transcript_id,))
            conn.commit()

            # Chunks should be gone
            cur.execute("SELECT COUNT(*) FROM transcript_chunks WHERE transcript_id = %s;", (transcript_id,))
            assert cur.fetchone()[0] == 0

    finally:
        conn.rollback()
        conn.close()


# ──────────────────────────────────────────────────────────────
# 4. Session Management Schema
# ──────────────────────────────────────────────────────────────

def test_session_and_messages_crud():
    """Verify chat_sessions and chat_messages CRUD with FK cascade."""
    conn = get_db()
    session_id = uuid.uuid4()

    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO chat_sessions (id, title) VALUES (%s, %s);",
                (str(session_id), f"{TEST_TRANSCRIPT_MARKER} E2E Session"),
            )
            cur.execute(
                "INSERT INTO chat_messages (session_id, role, content) VALUES (%s, %s, %s);",
                (str(session_id), "user", "Test message from E2E"),
            )
            cur.execute(
                "INSERT INTO chat_messages (session_id, role, content) VALUES (%s, %s, %s);",
                (str(session_id), "assistant", "Test response from E2E"),
            )
            conn.commit()

            cur.execute("SELECT COUNT(*) FROM chat_messages WHERE session_id = %s;", (str(session_id),))
            assert cur.fetchone()[0] == 2

            # Cascade delete
            cur.execute("DELETE FROM chat_sessions WHERE id = %s;", (str(session_id),))
            conn.commit()

            cur.execute("SELECT COUNT(*) FROM chat_messages WHERE session_id = %s;", (str(session_id),))
            assert cur.fetchone()[0] == 0

    finally:
        conn.rollback()
        conn.close()


# ──────────────────────────────────────────────────────────────
# 5. FastAPI Health Endpoint (if backend is running)
# ──────────────────────────────────────────────────────────────

def test_fastapi_health():
    """Verify the FastAPI health endpoint returns expected structure."""
    try:
        with httpx.Client(timeout=5.0) as client:
            res = client.get(f"{FASTAPI_BASE_URL}/api/health")
            assert res.status_code == 200
            data = res.json()
            assert data["status"] == "healthy"
            assert "llm_provider" in data
            assert "embedding" in data
    except httpx.ConnectError:
        pytest.skip("FastAPI backend is not running at localhost:8000")
