# Changelog

## 0.1.0-canary.6 — 2026-08-27

Synchronizes the shared agent runtime with Locus 2.0 development: Codex-native
ChatGPT routing and patch application, model routing and proxy profiles,
resilient session provenance, automatic bounded Solo delegation, and the latest
team-budget contracts. It also adds three additive, fail-closed broker
contracts: separately opted-in browsing-history search, portable memory wrapped
as bounded untrusted evidence, and a native Locus Vault gateway whose signer
policy cannot be bypassed by agent permission mode.

## 0.1.0-canary.5 — 2026-08-24

Adds the private browser-intelligence contracts: a signed macOS semantic helper
backed by Apple Natural Language with a deterministic keyword fallback, strict
editable-field-free page snapshots, reader article extraction, and typed cited
research-board requests and results. Research runs are read-only, non-persisted,
bounded to explicitly supplied evidence, and reject missing or invented passage
citations before results reach the browser.

## 0.1.0-canary.4 — 2026-08-23

Adds the additive live browser observation and recording contracts used by
Locus Browser: typed speech settings, recording/source state, encrypted
transcript summaries, and a bounded optional `browser_context` on user and
steering messages. The agent injects that context ephemerally as untrusted
evidence and does not copy it into ordinary session history. The browser bridge
now returns protected credential/payment and inaccessible-frame geometry, and
the platform pins the checksummed Whisper runtime and multilingual model used
for default on-device transcription.

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
