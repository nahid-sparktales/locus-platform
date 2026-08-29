import { z } from "zod";

export const protocolVersion = 1 as const;

export const browserToolNames = [
  "browser_history",
  "browser_autofill",
  "browser_read_page",
  "browser_get_text",
  "browser_find",
  "browser_navigate",
  "browser_tabs",
  "browser_input",
  "browser_screenshot",
  "browser_wait_for",
  "browser_console",
  "browser_network",
  "browser_resize",
  "browser_javascript",
  "browser_dev_server",
] as const;

export const BrowserToolNameSchema = z.enum(browserToolNames);
export type BrowserToolName = z.infer<typeof BrowserToolNameSchema>;

export const BrowserAutofillCategorySchema = z.enum([
  "password", "contact", "paymentCard",
]);
export type BrowserAutofillCategory = z.infer<typeof BrowserAutofillCategorySchema>;

export const TabAccessLevelSchema = z.enum(["read", "interact"]);
export const TabAccessSourceSchema = z.enum(["user_share", "agent_created"]);
export type TabAccessLevel = z.infer<typeof TabAccessLevelSchema>;
export type TabAccessSource = z.infer<typeof TabAccessSourceSchema>;

export const TabAccessGrantSchema = z.object({
  sessionId: z.string().min(1),
  tabId: z.string().min(1),
  level: TabAccessLevelSchema,
  source: TabAccessSourceSchema,
  grantedAt: z.string().datetime(),
});

export type TabAccessGrant = z.infer<typeof TabAccessGrantSchema>;

export const SetBrowserControlSchema = z.object({
  type: z.literal("set_browser_control"),
  enabled: z.boolean(),
  history_enabled: z.boolean().optional(),
  autofill_categories: z.array(BrowserAutofillCategorySchema).optional(),
});

export const BrowserActionRequestSchema = z.object({
  type: z.literal("browser_action_request"),
  request_id: z.string().min(1),
  tool: BrowserToolNameSchema,
  arguments: z.record(z.string(), z.unknown()).default({}),
  timeout_ms: z.number().int().min(1).max(180_000),
  session_id: z.string().min(1),
  access: z.object({
    tab_id: z.string().min(1).optional(),
    level: TabAccessLevelSchema.optional(),
    source: TabAccessSourceSchema.optional(),
  }).optional(),
});

export type BrowserActionRequest = z.infer<typeof BrowserActionRequestSchema>;

export const ScreenshotPayloadSchema = z.object({
  mime_type: z.literal("image/png"),
  data: z.string().min(1),
  description: z.string().min(1),
});

export const BrowserActionPayloadSchema = z.object({
  text: z.string().optional(),
  error: z.string().optional(),
  screenshot: ScreenshotPayloadSchema.optional(),
}).passthrough().refine(
  (value) => value.text !== undefined || value.error !== undefined,
  "A browser result must contain text or error",
);

export const BrowserActionResultSchema = z.object({
  type: z.literal("browser_action_result"),
  request_id: z.string().min(1),
  result: BrowserActionPayloadSchema,
});

export type BrowserActionResult = z.infer<typeof BrowserActionResultSchema>;

export const walletToolNames = [
  "wallet_list_accounts",
  "wallet_get_balance",
  "wallet_get_activity",
  "wallet_prepare_transaction",
  "wallet_simulate_transaction",
  "wallet_execute_transaction",
  "wallet_lock",
] as const;

export const WalletToolNameSchema = z.enum(walletToolNames);
export type WalletToolName = z.infer<typeof WalletToolNameSchema>;

export const WalletCapabilitySchema = z.object({
  protocol_version: z.literal(1),
  signer_state: z.literal("unlocked"),
  session_id: z.string().min(1),
  supported_chains: z.array(z.string().regex(/^[^:]+:.+$/)).min(1),
  allowed_operations: z.array(WalletToolNameSchema).min(1),
});
export type WalletCapability = z.infer<typeof WalletCapabilitySchema>;

export const SetWalletControlSchema = z.object({
  type: z.literal("set_wallet_control"),
  capability: WalletCapabilitySchema.nullish(),
  // Kept only so v1 clients decode cleanly. The runtime treats this field as
  // fail-closed and never enables wallet tools without a validated capability.
  enabled: z.boolean().optional(),
});

export const WalletActionRequestSchema = z.object({
  type: z.literal("wallet_action_request"),
  request_id: z.string().min(1),
  tool: WalletToolNameSchema,
  arguments: z.record(z.string(), z.unknown()).default({}),
  timeout_ms: z.number().int().min(1).max(60_000),
  session_id: z.string().min(1),
});
export type WalletActionRequest = z.infer<typeof WalletActionRequestSchema>;

export const WalletActionPayloadSchema = z.object({
  text: z.string().optional(),
  error: z.string().optional(),
}).passthrough().refine(
  (value) => value.text !== undefined || value.error !== undefined,
  "A wallet result must contain text or error",
);

export const WalletActionResultSchema = z.object({
  type: z.literal("wallet_action_result"),
  request_id: z.string().min(1),
  result: WalletActionPayloadSchema,
});
export type WalletActionResult = z.infer<typeof WalletActionResultSchema>;

export const RecordingTranscriptSourceSchema = z.enum(["tab", "microphone"]);
export type RecordingTranscriptSource = z.infer<typeof RecordingTranscriptSourceSchema>;

export const RecordingTranscriptSegmentSchema = z.object({
  source: RecordingTranscriptSourceSchema,
  start_ms: z.number().int().min(0),
  end_ms: z.number().int().min(0),
  text: z.string().trim().min(1).max(4_000),
  tab_id: z.string().min(1).max(255).optional(),
}).refine((segment) => segment.end_ms >= segment.start_ms, "Transcript segment ends before it starts");
export type RecordingTranscriptSegment = z.infer<typeof RecordingTranscriptSegmentSchema>;

export const SpeechEngineSchema = z.enum(["local", "openai", "custom"]);
export type SpeechEngine = z.infer<typeof SpeechEngineSchema>;

export const SpeechSettingsSchema = z.object({
  engine: SpeechEngineSchema,
  language: z.string().min(2).max(16),
  custom_base_url: z.string().max(2_048).optional(),
  custom_model: z.string().max(255).optional(),
  local_model_status: z.enum(["missing", "downloading", "ready", "error"]),
  local_model_progress: z.number().min(0).max(1).optional(),
  message: z.string().max(2_000).optional(),
});
export type SpeechSettings = z.infer<typeof SpeechSettingsSchema>;

export const RecordingSourceStateSchema = z.object({
  tab_audio: z.boolean(),
  microphone: z.boolean(),
});
export type RecordingSourceState = z.infer<typeof RecordingSourceStateSchema>;

export const TranscriptSegmentSchema = z.object({
  id: z.string().min(1).max(255),
  recording_id: z.string().min(1).max(255),
  source: RecordingTranscriptSourceSchema,
  start_ms: z.number().int().min(0),
  end_ms: z.number().int().min(0),
  text: z.string().trim().min(1).max(4_000),
  tab_id: z.string().min(1).max(255).optional(),
}).refine((segment) => segment.end_ms >= segment.start_ms, "Transcript segment ends before it starts");
export type TranscriptSegment = z.infer<typeof TranscriptSegmentSchema>;

export const RecordingTranscriptSummarySchema = z.object({
  id: z.string().min(1).max(255),
  work_session_id: z.string().min(1).max(255),
  started_at: z.number().int().nonnegative(),
  ended_at: z.number().int().nonnegative().optional(),
  duration_ms: z.number().int().nonnegative(),
  segment_count: z.number().int().nonnegative(),
  video_path: z.string().max(8_192).optional(),
});

export const RecordingSessionStateSchema = z.object({
  status: z.enum(["idle", "starting", "recording", "paused", "stopping", "error"]),
  id: z.string().min(1).max(255).optional(),
  started_at: z.number().int().nonnegative().optional(),
  elapsed_ms: z.number().int().nonnegative(),
  sources: RecordingSourceStateSchema,
  save_video: z.boolean(),
  active_tab_id: z.string().min(1).max(255).optional(),
  paused_reason: z.string().max(512).optional(),
  transcript_preview: z.array(TranscriptSegmentSchema).max(20),
  transcripts: z.array(RecordingTranscriptSummarySchema).max(500),
  engine: SpeechEngineSchema,
  error: z.string().max(2_000).optional(),
});
export type RecordingSessionState = z.infer<typeof RecordingSessionStateSchema>;

export const BrowserObservationFrameSchema = z.object({
  captured_at: z.string().datetime(),
  mime_type: z.enum(["image/jpeg", "image/png", "image/webp"]),
  data: z.string().min(1).max(12_000_000),
  description: z.string().min(1).max(512),
});
export type BrowserObservationFrame = z.infer<typeof BrowserObservationFrameSchema>;

export const BrowserObservationContextSchema = z.object({
  recording_id: z.string().min(1).max(255),
  captured_at: z.string().datetime(),
  active_tab: z.object({
    id: z.string().min(1).max(255),
    title: z.string().max(2_048),
    url: z.string().max(8_192),
    access_level: TabAccessLevelSchema,
  }).optional(),
  transcript: z.array(RecordingTranscriptSegmentSchema).max(200).default([]),
  page_text: z.string().max(12_000).optional(),
  frames: z.array(BrowserObservationFrameSchema).max(4).default([]),
  paused_reason: z.string().max(512).optional(),
}).superRefine((context, issue) => {
  const transcriptChars = context.transcript.reduce((total, segment) => total + segment.text.length, 0);
  if (transcriptChars > 24_000) issue.addIssue({ code: "custom", message: "Recording transcript context exceeds 24,000 characters" });
  const frameChars = context.frames.reduce((total, frame) => total + frame.data.length, 0);
  if (frameChars > 12_000_000) issue.addIssue({ code: "custom", message: "Recording frame context exceeds 12 MB" });
});
export type BrowserObservationContext = z.infer<typeof BrowserObservationContextSchema>;

export const ResearchPassageSchema = z.object({
  passage_id: z.string().min(1).max(255),
  text: z.string().trim().min(1).max(12_000),
});
export type ResearchPassage = z.infer<typeof ResearchPassageSchema>;

export const ResearchSourceSchema = z.object({
  source_id: z.string().min(1).max(255),
  tab_id: z.string().min(1).max(255),
  title: z.string().max(2_048),
  url: z.string().url().max(8_192),
  captured_at: z.string().datetime(),
  content_hash: z.string().regex(/^[a-f0-9]{64}$/),
  passages: z.array(ResearchPassageSchema).min(1).max(80),
});
export type ResearchSource = z.infer<typeof ResearchSourceSchema>;

export const ResearchCitationSchema = z.object({
  source_id: z.string().min(1).max(255),
  passage_id: z.string().min(1).max(255),
});
export type ResearchCitation = z.infer<typeof ResearchCitationSchema>;

export const ResearchClaimSchema = z.object({
  text: z.string().trim().min(1).max(8_000),
  citations: z.array(ResearchCitationSchema).min(1).max(12),
});
export type ResearchClaim = z.infer<typeof ResearchClaimSchema>;

export const ResearchSectionSchema = z.object({
  heading: z.string().trim().min(1).max(500),
  claims: z.array(ResearchClaimSchema).min(1).max(50),
});

export const ResearchArtifactSchema = z.object({
  title: z.string().trim().min(1).max(500),
  summary: z.string().trim().min(1).max(12_000),
  sections: z.array(ResearchSectionSchema).min(1).max(30),
});
export type ResearchArtifact = z.infer<typeof ResearchArtifactSchema>;

export const ResearchBoardRequestSchema = z.object({
  type: z.literal("research_board_request"),
  request_id: z.string().min(1).max(255),
  prompt: z.string().trim().min(1).max(20_000),
  format: z.enum(["comparison", "brief", "evidence"]),
  sources: z.array(ResearchSourceSchema).min(1).max(10),
}).superRefine((request, issue) => {
  const sourceIds = new Set<string>();
  let characters = 0;
  for (const source of request.sources) {
    if (sourceIds.has(source.source_id)) issue.addIssue({ code: "custom", message: `Duplicate source id ${source.source_id}` });
    sourceIds.add(source.source_id);
    const passageIds = new Set<string>();
    for (const passage of source.passages) {
      characters += passage.text.length;
      if (passageIds.has(passage.passage_id)) issue.addIssue({ code: "custom", message: `Duplicate passage id ${passage.passage_id}` });
      passageIds.add(passage.passage_id);
    }
  }
  if (characters > 120_000) issue.addIssue({ code: "custom", message: "Research source context exceeds 120,000 characters" });
});
export type ResearchBoardRequest = z.infer<typeof ResearchBoardRequestSchema>;

export const ResearchBoardProgressSchema = z.object({
  type: z.literal("research_board_progress"),
  request_id: z.string().min(1).max(255),
  message: z.string().min(1).max(1_000),
});

export const ResearchBoardResultSchema = z.object({
  type: z.literal("research_board_result"),
  request_id: z.string().min(1).max(255),
  artifact: ResearchArtifactSchema,
});
export type ResearchBoardResult = z.infer<typeof ResearchBoardResultSchema>;

export const ResearchBoardErrorSchema = z.object({
  type: z.literal("research_board_error"),
  request_id: z.string().min(1).max(255),
  error: z.string().min(1).max(4_000),
});

export const PortableMemoryRecordSchema = z.object({
  blob_id: z.string().trim().min(1).max(512),
  text: z.string().trim().min(1).max(12_000),
  title: z.string().trim().max(2_048).optional(),
  source_url: z.string().trim().url().max(8_192).refine(
    (value) => /^https?:\/\//.test(value),
    "Portable memory source URL must use HTTP or HTTPS",
  ).optional(),
  captured_at: z.string().datetime().optional(),
  content_sha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
});
export type PortableMemoryRecord = z.infer<typeof PortableMemoryRecordSchema>;

export const PortableMemorySchema = z.array(PortableMemoryRecordSchema).max(5).superRefine((records, issue) => {
  const characters = records.reduce((total, record) => total + record.text.length, 0);
  if (characters > 12_000) issue.addIssue({ code: "custom", message: "Portable memory exceeds 12,000 characters" });
});

export const AgentUserMessageSchema = z.object({
  type: z.literal("user_message"),
  text: z.string().trim().min(1).max(200_000),
  mode: z.enum(["ask", "work", "plan", "build"]).optional(),
  browser_context: BrowserObservationContextSchema.optional(),
  portable_memory: PortableMemorySchema.optional(),
}).passthrough();
export type AgentUserMessage = z.infer<typeof AgentUserMessageSchema>;

export const BrowserTabSnapshotSchema = z.object({
  id: z.string().min(1),
  windowId: z.string().min(1),
  profileId: z.string().min(1),
  title: z.string(),
  url: z.string(),
  faviconUrl: z.string().optional(),
  active: z.boolean(),
  loading: z.boolean(),
  canGoBack: z.boolean(),
  canGoForward: z.boolean(),
  audible: z.boolean(),
  muted: z.boolean(),
  private: z.boolean(),
  grants: z.array(TabAccessGrantSchema),
});

export type BrowserTabSnapshot = z.infer<typeof BrowserTabSnapshotSchema>;

export const ClientAgentMessageSchema = z.discriminatedUnion("type", [
  SetBrowserControlSchema,
  BrowserActionResultSchema,
  SetWalletControlSchema,
  WalletActionResultSchema,
  AgentUserMessageSchema,
  ResearchBoardRequestSchema,
]);

export type ClientAgentMessage = z.infer<typeof ClientAgentMessageSchema>;

export const ResearchBoardEventSchema = z.discriminatedUnion("type", [
  ResearchBoardProgressSchema,
  ResearchBoardResultSchema,
  ResearchBoardErrorSchema,
]);
export type ResearchBoardEvent = z.infer<typeof ResearchBoardEventSchema>;

export function validateResearchArtifactCitations(
  artifact: ResearchArtifact,
  sources: readonly ResearchSource[],
): boolean {
  const passages = new Set(sources.flatMap((source) => source.passages.map((passage) => `${source.source_id}:${passage.passage_id}`)));
  return artifact.sections.every((section) => section.claims.every((claim) =>
    claim.citations.length > 0 && claim.citations.every((citation) => passages.has(`${citation.source_id}:${citation.passage_id}`)),
  ));
}
