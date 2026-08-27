"""Cross-language platform fixtures remain valid against their JSON Schema."""
from __future__ import annotations

import json
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[2]


def test_browser_wire_fixtures_match_their_schema_definitions() -> None:
    schema = json.loads((ROOT / "schemas/browser-wire.schema.json").read_text())
    fixtures = json.loads((ROOT / "ProtocolFixtures/browser-wire-v1.json").read_text())
    definitions = {
        "setBrowserControl": "setBrowserControl",
        "browserActionRequest": "browserActionRequest",
        "browserActionResult": "browserActionResult",
        "walletControl": "setWalletControl",
        "walletActionRequest": "walletActionRequest",
        "walletActionResult": "walletActionResult",
        "speechSettings": "speechSettings",
        "recordingSessionState": "recordingSessionState",
        "agentUserMessage": "agentUserMessage",
        "researchBoardRequest": "researchBoardRequest",
        "researchBoardResult": "researchBoardResult",
    }

    assert set(fixtures) == set(definitions)
    for fixture_name, definition_name in definitions.items():
        target = {
            "$schema": schema["$schema"],
            "$defs": schema["$defs"],
            "$ref": f"#/$defs/{definition_name}",
        }
        Draft202012Validator(target, format_checker=FormatChecker()).validate(
            fixtures[fixture_name]
        )
