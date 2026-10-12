import pytest
from app.agent import LennyGrowthAgent, AgentTranscript


@pytest.mark.asyncio
async def test_agent_session_creation():
    agent = LennyGrowthAgent()
    sid = agent.get_or_create_session()
    assert sid is not None
    assert len(sid) > 0
    # Re-requesting same sid returns same
    assert agent.get_or_create_session(sid) == sid


@pytest.mark.asyncio
async def test_agent_execution_transcript_steps():
    agent = LennyGrowthAgent()
    transcript = await agent.execute("What are the best frameworks for customer retention in B2B?")
    
    assert isinstance(transcript, AgentTranscript)
    assert transcript.session_id is not None
    assert len(transcript.steps) >= 2
    
    # Check that search tool was recorded in transcript
    step_actions = [s.action for s in transcript.steps]
    assert any("search_lenny_knowledge" in act for act in step_actions)
    assert transcript.provider in ("local", "cloud")
    assert transcript.final_output is not None


@pytest.mark.asyncio
async def test_agent_ship30_essay_artifact():
    agent = LennyGrowthAgent()
    transcript = await agent.execute("Write a Ship 30 for 30 essay about Product-Led Sales")
    
    assert isinstance(transcript, AgentTranscript)
    # Check that write_ship30_essay tool was called
    tool_names = [s.tool_name for s in transcript.steps if s.tool_name]
    assert "write_ship30_essay" in tool_names
    
    # Check artifact generation
    assert len(transcript.artifacts) >= 1
    artifact = transcript.artifacts[0]
    assert artifact["type"] == "ship30_essay"
    assert "Product-Led Sales" in artifact["content"] or "The Unspoken Rule" in artifact["content"]
    assert artifact["word_count"] > 50
