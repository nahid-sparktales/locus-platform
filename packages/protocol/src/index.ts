import { z } from "zod";

export const protocolVersion = 1 as const;

export const browserToolNames = [
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

export const AgentUserMessageSchema = z.object({
  type: z.literal("user_message"),
  text: z.string().trim().min(1).max(200_000),
  mode: z.enum(["ask", "work", "plan", "build"]).optional(),
  browser_context: BrowserObservationContextSchema.optional(),
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
  AgentUserMessageSchema,
]);

export type ClientAgentMessage = z.infer<typeof ClientAgentMessageSchema>;
