# Changelog

## 0.1.0-canary.1 — unreleased

First shared canary contract for Locus Browser:

- Python agent runtime and locked runtime dependencies;
- versioned browser wire schema and OpenAPI contract;
- generated TypeScript and Swift protocol clients;
- engine-neutral isolated-world browser bridge;
- golden protocol fixtures and direct-download feature parity manifest.

Schema evolution is additive within this canary contract. Browser tool names and
the `set_browser_control`, `browser_action_request`, and
`browser_action_result` envelopes remain wire-compatible.
