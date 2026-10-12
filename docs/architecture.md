# Technical Architecture

## 1. High-Level Architecture
The application follows a standard three-tier architecture optimized for local, low-memory execution on an 8 GB RAM Windows workstation.

* **Frontend:** Next.js application responsible for UI rendering, session management, and the Secure Artifact Viewer. Communicates with the backend via REST APIs.
* **Backend:** FastAPI application acting as the central orchestrator. It handles API requests, database interactions, and executes the Agent loop.
* **Database:** PostgreSQL with `pgvector`. A single container handles both relational data and vector similarity search.
* **LLM Engine:** Local Ollama process (running on the host OS at `http://localhost:11434`) or external Cloud Provider (Anthropic).

## 2. Agent Layer & SDK Integration
* **Agent Integration:** Utilizes official Claude Agent SDK (`claude-agent-sdk` v0.2.165) and Anthropic Python SDK patterns with in-process MCP tools.
* **Dual-Provider Architecture:**
  - **Local Mode (`AGENT_PROVIDER=local`):** Uses LiteLLM translation proxy to route completions to local Ollama (`llama3.2:3b` as primary, `qwen2.5-coder:1.5b` as automatic fallback).
  - **Cloud Mode (`AGENT_PROVIDER=cloud`):** Connects to Anthropic Claude (e.g. `claude-3-5-sonnet-20241022`) using `ANTHROPIC_API_KEY`. Missing or invalid credentials raise explicit errors and fall back gracefully to local execution.
* **Genuine Tool Calling & Transcripts:**
  - `search_lenny_knowledge(query, limit)`: Performs cosine similarity vector search against `transcript_chunks` stored in PostgreSQL `pgvector`.
  - `write_ship30_essay(topic, framework, context)`: Dedicated Ship 30 for 30 Atomic Essay writing skill generating structured, high-signal essays (Headline, Hook, Lead-in, 3 Main Pillars, Golden Nugget takeaway) under 300 words.
  - Every agent turn produces an `AgentTranscript` recording exact step-by-step tool calls, observations, provider/model metadata, and generated artifacts.

## 3. Replaceable Embedding Interface
Embeddings for the RAG pipeline are abstracted via `EmbeddingService`:
* **Interface:** `EmbeddingService.embed_text(text: str) -> List[float]` and `embed_batch(texts: List[str]) -> List[List[float]]`.
* **Local Implementation:** Uses Ollama's embeddings API (e.g., `nomic-embed-text`) or deterministic test fixtures (`FakeEmbeddingService`).
* **Vector Constraints:** pgvector dimension strictly enforced at 768 to match the vector schema in `transcript_chunks`.

## 4. Resource Management (8 GB RAM Constraint)
* Windows OS + Desktop: ~2.5 GB.
* Ollama (`llama3.2:3b` loaded): ~2.5 GB.
* PostgreSQL (`lenny_postgres` Docker container capped): ~1.0 GB.
* FastAPI backend + LiteLLM (in-process Python): ~300 MB.
* Next.js dev server: ~300 MB.
* Total footprint ~6.6 GB, preserving ~1.4 GB memory headroom.
