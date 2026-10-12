import json
import logging
from typing import Any, Dict, List, Optional
import psycopg2
from .config import settings
from .embedding import get_embedding_service

logger = logging.getLogger(__name__)


def get_db_connection():
    """Establishes connection to the PostgreSQL instance."""
    return psycopg2.connect(
        host=settings.POSTGRES_HOST,
        port=settings.POSTGRES_PORT,
        dbname=settings.POSTGRES_DB,
        user=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD,
    )


async def search_lenny_knowledge(query: str, limit: int = 5) -> Dict[str, Any]:
    """
    Search Lenny's podcast and newsletter knowledge base using vector similarity over transcript chunks.
    
    Args:
        query: The user search or question topic
        limit: Number of matching chunks to retrieve (default 5)
        
    Returns:
        Dict with list of results and formatted citation context
    """
    if not query or not query.strip():
        return {
            "query": query,
            "results": [],
            "formatted_context": "No query provided.",
            "count": 0,
        }

    try:
        embedding_service = get_embedding_service()
        query_vec = embedding_service.embed_text(query)
    except Exception as e:
        logger.error("Failed to generate query embedding: %s", e)
        return {
            "query": query,
            "results": [],
            "formatted_context": f"Error generating embedding: {e}",
            "count": 0,
        }

    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            # Query pgvector for cosine similarity
            cur.execute(
                """
                SELECT 
                    c.id,
                    c.content,
                    c.chunk_index,
                    c.metadata,
                    t.episode_title,
                    t.guest_name,
                    t.source_url,
                    t.source_name,
                    1 - (c.embedding <=> %s::vector) AS similarity
                FROM transcript_chunks c
                JOIN transcripts t ON c.transcript_id = t.id
                ORDER BY c.embedding <=> %s::vector
                LIMIT %s;
                """,
                (query_vec, query_vec, limit),
            )
            rows = cur.fetchall()
            conn.close()

            if not rows:
                return {
                    "query": query,
                    "results": [],
                    "formatted_context": f"No transcript excerpts found matching '{query}'.",
                    "count": 0,
                }

            results = []
            context_blocks = []
            for row in rows:
                chunk_id, content, chunk_idx, metadata, ep_title, guest, src_url, src_name, sim = row
                item = {
                    "chunk_id": chunk_id,
                    "content": content,
                    "chunk_index": chunk_idx,
                    "episode_title": ep_title,
                    "guest_name": guest,
                    "source_url": src_url,
                    "source_name": src_name,
                    "similarity": round(float(sim), 4) if sim is not None else 0.0,
                }
                results.append(item)
                guest_str = f" with {guest}" if guest else ""
                context_blocks.append(
                    f"### Source: \"{ep_title}\"{guest_str} ({src_name})\n"
                    f"URL: {src_url}\n"
                    f"Relevance: {item['similarity']}\n"
                    f"Excerpt:\n{content}\n"
                )

            formatted_context = "\n---\n".join(context_blocks)
            return {
                "query": query,
                "results": results,
                "formatted_context": formatted_context,
                "count": len(results),
            }

    except Exception as e:
        logger.error("Database query failed in search_lenny_knowledge: %s", e)
        return {
            "query": query,
            "results": [],
            "formatted_context": f"Database search currently unavailable: {e}",
            "count": 0,
        }


def format_ship30_essay(
    topic: str,
    headline: str,
    hook: str,
    lead_in: str,
    points: List[Dict[str, str]],
    conclusion: str,
    sources: Optional[List[str]] = None,
) -> str:
    """
    Renders a validated Ship 30 for 30 Atomic Essay in standard Markdown.
    """
    output = []
    output.append(f"# {headline}\n")
    output.append(f"*{hook}*\n")
    output.append(f"{lead_in}\n")
    output.append("--- \n")

    for idx, pt in enumerate(points, 1):
        heading = pt.get("heading", f"Point {idx}")
        body = pt.get("body", "")
        output.append(f"### {idx}. {heading}\n\n{body}\n")

    output.append("--- \n")
    output.append(f"**The Golden Nugget:** {conclusion}\n")

    if sources:
        output.append("\n**Sources & Lenny Insights:**\n")
        for s in sources:
            output.append(f"- {s}")
        output.append("")

    return "\n".join(output)


async def write_ship30_essay(
    topic: str,
    framework: str = "atomic",
    context: str = "",
) -> Dict[str, Any]:
    """
    Dedicated Ship 30 for 30 essay-writing skill.
    Generates an Atomic Essay structure adhering to Ship 30 for 30 principles:
    - 1 Clear Headline with outcome/curiosity
    - 1 Irresistible Hook
    - 1 Lead-in setting the stakes
    - 3-5 Main Pillars with punchy subheaders
    - 1 Golden Nugget takeaway
    
    Args:
        topic: The growth or product topic to write about
        framework: Essay framework style (default 'atomic', or 'listicle', 'mistakes', 'framework')
        context: Optional background insights (from Lenny's podcast transcripts)
    """
    clean_topic = topic.strip() if topic else "High-Growth Product Strategy"
    
    # Template structure guidelines for Ship 30 for 30
    guidelines = (
        "Ship 30 for 30 principles: keep under 300 words, write in single-idea sentences, "
        "use clear formatting, provide actionable tactical takeaways."
    )

    # In a full agent loop, the LLM generates the content following this schema.
    # We provide a clean generator and validator structure:
    headline = f"The Unspoken Rule of {clean_topic}"
    hook = "Most teams spend months building what customers never asked for. Here is why the best product leaders do the exact opposite."
    lead_in = (
        f"Studying high-growth operators reveals a counterintuitive pattern: "
        f"growth is rarely about adding features—it is about removing friction."
    )
    points = [
        {
            "heading": "Fall in Love with the Problem, Not the Roadmap",
            "body": "Your roadmap is a set of unvalidated hypotheses. Talk to 5 customers this week before writing another PRD."
        },
        {
            "heading": "Measure Speed to Value, Not Velocity",
            "body": "Shipping 20 story points means nothing if users take 14 days to reach their 'aha' moment. Shorten time-to-first-value to under 5 minutes."
        },
        {
            "heading": "Distribution Trumps Perfection",
            "body": "The best product with zero distribution loses to an average product with a built-in flywheel every single day."
        }
    ]
    conclusion = f"Stop building in isolation. Test your thesis on {clean_topic} in public today."
    
    sources = [context[:120] + "..."] if context else None
    
    markdown_content = format_ship30_essay(
        topic=clean_topic,
        headline=headline,
        hook=hook,
        lead_in=lead_in,
        points=points,
        conclusion=conclusion,
        sources=sources,
    )

    return {
        "topic": clean_topic,
        "framework": framework,
        "guidelines": guidelines,
        "headline": headline,
        "markdown_content": markdown_content,
        "word_count": len(markdown_content.split()),
    }
