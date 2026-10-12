# Product Requirements Document (PRD)

## Discovery Brief

### 1. Target User
Product Managers, Growth Engineers, and startup founders seeking actionable growth advice and essay generation based on insights from Lenny's Podcast and Newsletter.

### 2. Problem Statement
Users want to quickly extract highly specific, source-grounded insights from the vast library of Lenny's content without listening to hours of podcasts or reading hundreds of newsletters. They also want to synthesize this knowledge into concise, publish-ready essays (e.g., Ship 30 for 30 format).

### 3. Measurable Success Metrics
* **RAG Accuracy:** 90%+ of agent responses accurately cite a provided transcript when queried about Lenny's content.
* **Fallback Gracefulness:** 100% of missing information queries result in a safe "I don't know" rather than a hallucination.
* **Performance:** Local inference and RAG retrieval execute within acceptable timeframes on an 8 GB RAM Windows machine without causing OS swapping or crashes.
* **Demo Success:** A successful 2-3 minute YouTube demo running entirely on local Ollama models.

### 4. Assumptions
* Users will have Docker Desktop and Ollama installed.
* Authentic transcripts will be provided or ingested in plain text/markdown format.
* The local 3B model (e.g., Llama 3.2:3b) can successfully interpret simplified tool-calling schemas via translation layers.

### 5. Scope
* **In Scope:** Chat interface, Session history, Source-grounded RAG over a provided corpus, "Ship 30 for 30" writing skill, isolated Artifact Viewer, local Ollama integration, optional cloud LLM integration.
* **Out of Scope:** Multi-user authentication, production cloud deployment, real-time audio transcription.

### 6. Risks
* **Hardware Limitations:** Running Next.js, FastAPI, Postgres, and Ollama concurrently on 8 GB RAM is highly constrained.
* **SDK Compatibility:** The Anthropic SDK is optimized for Claude; forcing it to work with local 3B models via LiteLLM proxy may result in broken JSON schemas or failed tool calls.
* **Security:** Rendering LLM-generated HTML in the artifact viewer introduces XSS risks.

### 7. Trade-offs
* Traded a dedicated vector database (like Milvus) for `pgvector` inside PostgreSQL to save memory.
* Traded complex, multi-step agent reasoning for simplified, flat tool calls to ensure local 3B models can successfully execute them.

---

## Features (Planned)
1. **Agent Chat:** Conversational interface with memory.
2. **Knowledge Retrieval (RAG):** Ability to search transcripts and cite sources.
3. **Essay Writer:** Dedicated tool for formatting content into Ship 30 for 30 essays.
4. **Artifact Viewer:** Secure Markdown/HTML renderer for generated essays.
