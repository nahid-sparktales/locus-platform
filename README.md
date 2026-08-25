# Locus Platform

Shared runtime and compatibility contracts for Locus and Locus Browser.

This repository owns the parts of the product that must stay wire-compatible:

- the Python agent runtime in `agent/`;
- JSON Schema/OpenAPI plus generated TypeScript and Swift protocol clients;
- the isolated-world page bridge in `packages/browser-bridge/`;
- the signed Apple Natural Language semantic helper and strict Reader/Recall
  content extraction contracts;
- typed, citation-validated, read-only Research Board messages and runtime;
- protocol fixtures and the direct-download parity manifest.

The native Swift Locus app and the Electron Locus Browser keep separate UI and
browser-engine adapters. Both consume tagged releases from this repository and
must pass the same protocol fixtures.

The Intelligence and Productivity Canary pins the immutable
`v0.1.0-canary.5` tag. Platform
tags run TypeScript, Swift, schema/fixture, Python, lint, and dependency-audit
gates before they can be selected by the browser release environment.

## Development

```bash
pnpm install
pnpm test
pnpm typecheck
swift test

cd agent
python3 -m venv .venv
.venv/bin/pip install -e ".[dev]"
.venv/bin/python -m pytest -q
```

Schema changes are additive by default. Removing a field, changing a field's
meaning, or changing a browser tool name requires a protocol major version.
