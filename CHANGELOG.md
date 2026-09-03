# Changelog

## Unreleased

Synchronizes the shared runtime through Locus 2.3.0 development. Schedules and
event triggers now own one durable agent chat and reuse its local checkout;
overlapping occurrences are skipped without losing cadence. The runtime adds
bounded Gmail, Telegram, signed-webhook, and price-feed event ingestion,
deterministic filtering, durable delivery/retry state, connector-action
idempotency receipts, and caller-scoped connector tool schemas whose secrets
remain in the native owner. Platform-only browser, research, memory, speech,
Autofill, and wallet-broker capabilities remain intact, and native wallet
recovery presentation remains outside this shared protocol boundary.

Synchronizes the shared runtime with Locus 2.1.0: Grill mode replaces the
retired GSD build mode in the protocol (the old value stays accepted for older
clients and stored schedules), agent questions surface as structured
question-prompt events, run overviews scope their file/step/model readouts to
the selected run's own events, turns close with a written answer, ChatGPT turn
usage is scoped to the turn, spawn sites sanitize the environment and keep
proxy credentials out of helper processes, and produced-file reporting feeds
the Outputs surface. Platform-only contracts — live browser context, portable
memory, cited research, wallet broker, speech, and the semantic runtime —
are preserved through the merge and remain intact.

Synchronizes the shared Python runtime with Locus's modular backend ownership,
adaptive agent execution, structured transcript output, and current wallet
workflows. The wallet handshake now carries a validated least-authority signer
capability instead of trusting a boolean, and transaction preparation accepts
semantic Sepolia actions rather than raw caller-defined payloads.

Adds independently granted browser Autofill categories across the Python,
JSON Schema, TypeScript, Swift, fixture, and isolated-world bridge surfaces.
Password and payment-card access is shaped out of model schemas unless granted;
card security codes and one-time codes remain blocked. Existing bounded live
browser context, portable memory, cited research, signed component, speech, and
semantic-runtime contracts remain intact after the backend modularization.

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
