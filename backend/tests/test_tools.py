import pytest
from app.tools import search_lenny_knowledge, write_ship30_essay, format_ship30_essay


@pytest.mark.asyncio
async def test_search_lenny_knowledge_empty_query():
    res = await search_lenny_knowledge("")
    assert res["count"] == 0
    assert "No query provided" in res["formatted_context"]


@pytest.mark.asyncio
async def test_search_lenny_knowledge_handles_db_gracefully():
    # If the DB has no records or is unavailable, it should return a clear dict without crashing
    res = await search_lenny_knowledge("growth loops product market fit")
    assert "count" in res
    assert "results" in res
    assert "formatted_context" in res
    assert isinstance(res["results"], list)


@pytest.mark.asyncio
async def test_write_ship30_essay_structure():
    res = await write_ship30_essay("Product Led Growth", framework="atomic", context="Lenny Episode with Elena Verna")
    assert res["topic"] == "Product Led Growth"
    assert "The Unspoken Rule" in res["headline"]
    assert "markdown_content" in res
    md = res["markdown_content"]
    assert "# The Unspoken Rule" in md
    assert "The Golden Nugget:" in md
    assert res["word_count"] < 350  # Atomic essay constraint


def test_format_ship30_essay_rendering():
    md = format_ship30_essay(
        topic="Pricing",
        headline="How to Price Your B2B SaaS",
        hook="Most founders charge 10x too little.",
        lead_in="Here is what Madhavan Ramanujam taught us.",
        points=[
            {"heading": "Charge for Value", "body": "Never charge cost-plus."},
            {"heading": "Segment by Willingness to Pay", "body": "Different buyers have different budgets."},
            {"heading": "Raise Prices Annually", "body": "Inflation is real."}
        ],
        conclusion="Price on value metric, not seat count.",
        sources=["Lenny's Podcast #42"]
    )
    assert "# How to Price Your B2B SaaS" in md
    assert "*Most founders charge 10x too little.*" in md
    assert "### 1. Charge for Value" in md
    assert "### 3. Raise Prices Annually" in md
    assert "**The Golden Nugget:** Price on value metric, not seat count." in md
    assert "- Lenny's Podcast #42" in md
