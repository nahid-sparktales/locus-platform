# Locus Platform

Shared runtime and compatibility contracts for Locus and Locus Browser.

This repository owns the parts of the product that must stay wire-compatible:

- the Python agent runtime in `agent/`;
- JSON Schema/OpenAPI plus generated TypeScript and Swift protocol clients;
- the isolated-world page bridge in `packages/browser-bridge/`;
- protocol fixtures and the direct-download parity manifest.

The native Swift Locus app and the Electron Locus Browser keep separate UI and
browser-engine adapters. Both consume tagged releases from this repository and
must pass the same protocol fixtures.

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
