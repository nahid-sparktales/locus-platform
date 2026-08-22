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
]);

export type ClientAgentMessage = z.infer<typeof ClientAgentMessageSchema>;
