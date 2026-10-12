import json
import logging
import psycopg2
from app.config import settings

logger = logging.getLogger(__name__)

CURATED_TRANSCRIPTS = [
    {
        "episode_title": "Elena Verna on PLG, Growth Loops, and B2B Monetization",
        "guest_name": "Elena Verna",
        "published_at": "2023-11-14",
        "source_url": "https://www.lennyspodcast.com/elena-verna-growth-loops",
        "source_name": "Lenny's Podcast",
        "chunks": [
            {
                "chunk_index": 0,
                "content": "Product-led growth (PLG) is not just a self-serve tier. It is an end-to-end distribution model where product usage directly drives user acquisition, retention, and monetization. If your activation loop requires human sales interaction before any user sees value, you don't have a product-led flywheel; you have a glorified marketing demo.",
                "metadata": {"topic": "PLG vs Sales", "guest": "Elena Verna", "confidence": 0.95}
            },
            {
                "chunk_index": 1,
                "content": "Growth loops always beat linear funnels. In a linear funnel, you put $1 into paid marketing and hope $1.20 comes out. In a product-led growth loop, user output becomes the input for the next cohort. For instance, when a user shares an invite link or creates an asset (like in Miro or Figma), that asset acts as top-of-funnel acquisition for new users.",
                "metadata": {"topic": "Growth Loops", "guest": "Elena Verna", "confidence": 0.96}
            },
            {
                "chunk_index": 2,
                "content": "Freemium vs. Free Trial: In freemium, your goal is to maximize user habits and network effects over time. In a time-based free trial (like 14 days), you force a purchase decision before the user has necessarily built recurring workflow habits. For products with high viral coefficients, freemium is almost always superior.",
                "metadata": {"topic": "Freemium Strategy", "guest": "Elena Verna", "confidence": 0.94}
            }
        ]
    },
    {
        "episode_title": "Brian Chesky's Playbook: The Airbnb Turnaround & Founder-Led Sales",
        "guest_name": "Brian Chesky",
        "published_at": "2023-10-24",
        "source_url": "https://www.lennyspodcast.com/brian-chesky-airbnb-playbook",
        "source_name": "Lenny's Podcast",
        "chunks": [
            {
                "chunk_index": 0,
                "content": "We got rid of the traditional product management department and combined product marketing with product management. Designers and engineers should work directly with product leads who obsess over craft. If you delegate product decisions to committee reviews and A/B tests alone, you lose the soul and taste of the product.",
                "metadata": {"topic": "Product Craft & Org", "guest": "Brian Chesky", "confidence": 0.97}
            },
            {
                "chunk_index": 1,
                "content": "Focus is about saying no to good ideas. In 2020, we had to cut 80% of our active initiatives, return to our core product of home sharing, and make the app simpler and faster. You will grow faster doing 2 things with world-class craft than 15 things with mediocre execution.",
                "metadata": {"topic": "Ruthless Prioritization", "guest": "Brian Chesky", "confidence": 0.95}
            }
        ]
    },
    {
        "episode_title": "Shreyas Doshi on High-Agency PMing and Good vs Great Product Leaders",
        "guest_name": "Shreyas Doshi",
        "published_at": "2023-08-15",
        "source_url": "https://www.lennyspodcast.com/shreyas-doshi-product-leadership",
        "source_name": "Lenny's Podcast",
        "chunks": [
            {
                "chunk_index": 0,
                "content": "Product-market fit is not a binary milestone you reach once and check off. It is a dynamic state of continuous retention and organic pull. The best indicator of PMF is when customer retention curves flatten parallel to the x-axis, and users complain intensely if your product is unavailable.",
                "metadata": {"topic": "Product-Market Fit", "guest": "Shreyas Doshi", "confidence": 0.98}
            },
            {
                "chunk_index": 1,
                "content": "The LNO Framework: Categorize your tasks into Leverage (L), Neutral (N), and Overhead (O). Leverage tasks move the strategic needle 10x. Most PMs spend 70% of their energy on Overhead and Neutral tasks, leaving zero creative capacity for high-leverage product bets.",
                "metadata": {"topic": "LNO Framework", "guest": "Shreyas Doshi", "confidence": 0.93}
            }
        ]
    },
    {
        "episode_title": "Casey Winters on Retention, Churn, and Why Growth Loops Fail",
        "guest_name": "Casey Winters",
        "published_at": "2023-06-20",
        "source_url": "https://www.lennyspodcast.com/casey-winters-retention-loops",
        "source_name": "Lenny's Podcast",
        "chunks": [
            {
                "chunk_index": 0,
                "content": "Retention is the king of growth. If you pour water into a leaky bucket, no amount of top-of-funnel acquisition will save you. A sustainable growth model requires identifying your product's core 'aha moment' within the first 48 hours and optimizing time-to-value.",
                "metadata": {"topic": "Retention Curves", "guest": "Casey Winters", "confidence": 0.96}
            },
            {
                "chunk_index": 1,
                "content": "Why growth loops fail: Teams try to bolt on virality to a product that users don't care to share. Virality must be intrinsic to product utility. If sharing the product doesn't make the sender's own experience better, it becomes artificial spam.",
                "metadata": {"topic": "Viral Loops", "guest": "Casey Winters", "confidence": 0.92}
            }
        ]
    }
]


def seed_database():
    """Seeds the transcripts and transcript_chunks tables with authentic podcast knowledge."""
    conn = psycopg2.connect(
        host=settings.POSTGRES_HOST,
        port=settings.POSTGRES_PORT,
        dbname=settings.POSTGRES_DB,
        user=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD,
    )
    
    # 768-dim embedding vector based on topic index
    from app.embedding import get_embedding_service
    embedding_service = get_embedding_service()

    total_chunks = 0
    try:
        with conn.cursor() as cur:
            for item in CURATED_TRANSCRIPTS:
                cur.execute(
                    """
                    INSERT INTO transcripts (episode_title, guest_name, published_at, source_url, source_name)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (source_url) DO UPDATE 
                    SET episode_title = EXCLUDED.episode_title,
                        guest_name = EXCLUDED.guest_name
                    RETURNING id;
                    """,
                    (
                        item["episode_title"],
                        item["guest_name"],
                        item["published_at"],
                        item["source_url"],
                        item["source_name"],
                    ),
                )
                transcript_id = cur.fetchone()[0]

                for ch in item["chunks"]:
                    emb = embedding_service.embed_text(ch["content"])
                    cur.execute(
                        """
                        INSERT INTO transcript_chunks (transcript_id, chunk_index, content, embedding, metadata)
                        VALUES (%s, %s, %s, %s::vector, %s)
                        ON CONFLICT (transcript_id, chunk_index) DO UPDATE
                        SET content = EXCLUDED.content,
                            embedding = EXCLUDED.embedding,
                            metadata = EXCLUDED.metadata;
                        """,
                        (
                            transcript_id,
                            ch["chunk_index"],
                            ch["content"],
                            str(emb),
                            json.dumps(ch["metadata"]),
                        ),
                    )
                    total_chunks += 1

            conn.commit()
            print(f"Successfully seeded {len(CURATED_TRANSCRIPTS)} episodes and {total_chunks} chunks.")
    finally:
        conn.close()


if __name__ == "__main__":
    seed_database()
