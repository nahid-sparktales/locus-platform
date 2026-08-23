# Changelog

## 0.1.0-canary.3 — 2026-08-23

Adds the fully pinned Apple Silicon OpenAI Codex App Server component contract
used by Locus Browser's managed ChatGPT Plan route. The contract records the
upstream package, version, archive and executable hashes, size, architecture,
license, and signing identity; the Python bridge derives its accepted runtime
version from the same manifest.

## 0.1.0-canary.2 — 2026-08-23

First shared canary contract for Locus Browser:

- Python agent runtime and locked runtime dependencies;
- versioned browser wire schema and OpenAPI contract;
- generated TypeScript and Swift protocol clients;
- engine-neutral isolated-world browser bridge;
- golden protocol fixtures and direct-download feature parity manifest.

Schema evolution is additive within this canary contract. Browser tool names and
the `set_browser_control`, `browser_action_request`, and
`browser_action_result` envelopes remain wire-compatible.

`v0.1.0-canary.1` was superseded before distribution because its hosted CI
image provided Swift 5.10 for a Swift 6 package.
