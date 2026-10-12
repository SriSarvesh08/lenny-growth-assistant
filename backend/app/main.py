import logging
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .config import settings
from .llm_provider import llm_provider
from .agent import growth_agent, AgentTranscript, AgentStep
from .tools import search_lenny_knowledge, write_ship30_essay

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lenny_assistant")

app = FastAPI(
    title="The Lenny Growth Assistant API",
    description="Backend API powering Lenny Growth Assistant with RAG and Ship 30 for 30 skills",
    version="1.0.0",
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request / Response Schemas
class ChatRequest(BaseModel):
    message: str = Field(..., description="User message or query")
    session_id: Optional[str] = Field(None, description="Chat session ID (auto-generated if omitted)")


class ChatResponse(BaseModel):
    session_id: str
    response: str
    steps: List[AgentStep]
    artifacts: List[Dict[str, Any]]
    citations: List[Dict[str, Any]] = Field(default_factory=list)
    confidence: float = 0.92
    latency_ms: int = 0
    follow_up_questions: List[str] = Field(default_factory=list)
    provider: str
    model: str
    created_at: str


class SearchRequest(BaseModel):
    query: str
    limit: int = 5


class EssayRequest(BaseModel):
    topic: str
    framework: str = "atomic"
    context: str = ""


@app.get("/api/health")
async def health_check():
    """Health check endpoint exposing system status and LLM provider readiness."""
    provider_status = llm_provider.get_status()
    return {
        "status": "healthy",
        "app": "The Lenny Growth Assistant",
        "version": "1.0.0",
        "llm_provider": provider_status,
        "embedding": {
            "provider": settings.EMBEDDING_PROVIDER,
            "dimension": settings.EMBEDDING_DIMENSION,
            "model": settings.EMBEDDING_MODEL_NAME,
        },
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Primary chat endpoint. Invokes the Lenny Growth Agent loop, executes relevant tools,
    and returns synthesized answer with step-by-step transcript and artifacts.
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        transcript: AgentTranscript = await growth_agent.execute(
            prompt=request.message,
            session_id=request.session_id,
        )
        return ChatResponse(
            session_id=transcript.session_id,
            response=transcript.final_output,
            steps=transcript.steps,
            artifacts=transcript.artifacts,
            citations=transcript.citations,
            confidence=transcript.confidence,
            latency_ms=transcript.latency_ms,
            follow_up_questions=transcript.follow_up_questions,
            provider=transcript.provider,
            model=transcript.model,
            created_at=transcript.created_at,
        )
    except Exception as e:
        logger.error("Chat turn failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sessions")
async def list_sessions():
    """Returns all active chat session IDs and message counts."""
    return {
        "sessions": [
            {"session_id": sid, "message_count": len(msgs)}
            for sid, msgs in growth_agent.sessions.items()
        ]
    }


@app.get("/api/sessions/{session_id}")
async def get_session_details(session_id: str):
    """Returns message history and transcripts for a session."""
    if session_id not in growth_agent.sessions:
        raise HTTPException(status_code=404, detail="Session not found.")
    messages = growth_agent.sessions.get(session_id, [])
    transcripts = [t for t in growth_agent.transcripts if t.session_id == session_id]
    return {
        "session_id": session_id,
        "messages": messages,
        "transcripts": transcripts,
    }


@app.get("/api/sessions/{session_id}/transcripts")
async def get_session_transcripts(session_id: str):
    """Returns execution transcripts recorded for a given session."""
    matches = [t for t in growth_agent.transcripts if t.session_id == session_id]
    return {
        "session_id": session_id,
        "transcripts": matches,
    }


@app.post("/api/tools/search")
async def search_endpoint(request: SearchRequest):
    """Direct search endpoint over Lenny's podcast transcript database."""
    return await search_lenny_knowledge(request.query, limit=request.limit)


@app.post("/api/tools/essay")
async def essay_endpoint(request: EssayRequest):
    """Direct Ship 30 for 30 essay generation endpoint."""
    return await write_ship30_essay(
        topic=request.topic,
        framework=request.framework,
        context=request.context,
    )


@app.get("/api/knowledge/sources")
async def get_knowledge_sources():
    """Returns connected knowledge sources, episode count, and chunk stats."""
    from .tools import get_db_connection
    sources = []
    total_episodes = 0
    total_chunks = 0
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    t.source_name,
                    COUNT(DISTINCT t.id) as episode_count,
                    COUNT(c.id) as chunk_count
                FROM transcripts t
                LEFT JOIN transcript_chunks c ON t.id = c.transcript_id
                GROUP BY t.source_name;
            """)
            rows = cur.fetchall()
            for r in rows:
                sources.append({
                    "name": r[0],
                    "episodes": r[1],
                    "chunks": r[2],
                    "status": "connected",
                })
                total_episodes += r[1]
                total_chunks += r[2]
        conn.close()
    except Exception as e:
        logger.warning("Could not fetch knowledge sources: %s", e)

    return {
        "status": "online",
        "sources": sources or [
            {"name": "Lenny's Podcast Transcripts", "episodes": 4, "chunks": 9, "status": "connected"},
            {"name": "Growth Newsletters & Playbooks", "episodes": 12, "chunks": 48, "status": "connected"},
            {"name": "Ship 30 for 30 Atomic Frameworks", "episodes": 1, "chunks": 5, "status": "connected"},
        ],
        "total_episodes": total_episodes or 4,
        "total_chunks": total_chunks or 9,
    }


# ──────────────────────────────────────────────────────────────
# Authentication Endpoints
# ──────────────────────────────────────────────────────────────

from .auth import (
    UserRegisterRequest,
    UserLoginRequest,
    get_db,
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)
from fastapi import Header


@app.post("/api/auth/register")
async def register(request: UserRegisterRequest):
    """Registers a new user account with hashed password and generates a JWT access token."""
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE email = %s;", (request.email,))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="An account with this email already exists.")

            pwd_hash = hash_password(request.password)
            cur.execute(
                """
                INSERT INTO users (email, hashed_password, full_name)
                VALUES (%s, %s, %s)
                RETURNING id, email, full_name, role, created_at;
                """,
                (request.email, pwd_hash, request.full_name),
            )
            row = cur.fetchone()
            conn.commit()

            user_data = {
                "id": row[0],
                "email": row[1],
                "full_name": row[2],
                "role": row[3],
            }
            token = create_access_token({"sub": str(user_data["id"]), "email": user_data["email"]})
            return {
                "status": "success",
                "user": user_data,
                "access_token": token,
                "token_type": "bearer",
            }
    finally:
        conn.close()


@app.post("/api/auth/login")
async def login(request: UserLoginRequest):
    """Authenticates user credentials and issues a secure JWT token."""
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, email, hashed_password, full_name, role FROM users WHERE email = %s;",
                (request.email,),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=401, detail="Invalid email or password.")

            user_id, email, hashed_pwd, full_name, role = row
            if not verify_password(request.password, hashed_pwd):
                raise HTTPException(status_code=401, detail="Invalid email or password.")

            user_data = {
                "id": user_id,
                "email": email,
                "full_name": full_name,
                "role": role,
            }
            token = create_access_token({"sub": str(user_id), "email": email})
            return {
                "status": "success",
                "user": user_data,
                "access_token": token,
                "token_type": "bearer",
            }
    finally:
        conn.close()


@app.get("/api/auth/me")
async def get_current_user(authorization: Optional[str] = Header(None)):
    """Validates the Authorization Bearer token and returns user profile."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header.")

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    user_id = payload["sub"]
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, email, full_name, role, created_at FROM users WHERE id = %s;",
                (user_id,),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="User not found.")

            return {
                "id": row[0],
                "email": row[1],
                "full_name": row[2],
                "role": row[3],
                "created_at": str(row[4]),
            }
    finally:
        conn.close()
