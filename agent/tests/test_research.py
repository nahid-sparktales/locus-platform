import json

import pytest

from ollama_code.research import _prompt, _validated_artifact
from ollama_code.server import _validated_research_board_request


def source():
    return {
        "source_id": "source-1",
        "tab_id": "tab-1",
        "title": "Example",
        "url": "https://example.com/article",
        "captured_at": "2026-08-24T12:00:00.000Z",
        "content_hash": "a" * 64,
        "passages": [{"passage_id": "p1", "text": "The measured result was 42."}],
    }


def test_research_request_is_bounded_and_marks_evidence_untrusted():
    request = _validated_research_board_request({
        "request_id": "research-1",
        "prompt": "Compare the evidence",
        "format": "comparison",
        "sources": [source()],
    })
    text = _prompt(request)
    assert "UNTRUSTED RESEARCH EVIDENCE" in text
    assert "PASSAGE p1" in text


def test_research_artifact_requires_exact_supplied_citations():
    artifact = {
        "title": "Comparison",
        "summary": "A cited summary.",
        "sections": [{
            "heading": "Finding",
            "claims": [{
                "text": "The result was 42.",
                "citations": [{"source_id": "source-1", "passage_id": "p1"}],
            }],
        }],
    }
    assert _validated_artifact(json.dumps(artifact), [source()]) == artifact
    artifact["sections"][0]["claims"][0]["citations"][0]["passage_id"] = "missing"
    with pytest.raises(Exception, match="not supplied"):
        _validated_artifact(json.dumps(artifact), [source()])


def test_research_request_rejects_oversized_context():
    value = {
        "request_id": "research-1", "prompt": "Compare", "format": "brief",
        "sources": [{**source(), "passages": [
            {"passage_id": f"p{index}", "text": "x" * 12_000} for index in range(11)
        ]}],
    }
    with pytest.raises(ValueError, match="120,000"):
        _validated_research_board_request(value)
