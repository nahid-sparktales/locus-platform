import { describe, expect, it } from "vitest";
import {
  BrowserActionRequestSchema,
  BrowserActionResultSchema,
  AgentUserMessageSchema,
  RecordingSessionStateSchema,
  SpeechSettingsSchema,
  TabAccessGrantSchema,
  browserToolNames,
} from "./index.js";

describe("browser protocol", () => {
  it("keeps the complete browser tool contract", () => {
    expect(browserToolNames).toHaveLength(13);
    expect(new Set(browserToolNames).size).toBe(browserToolNames.length);
  });

  it("accepts additive action metadata", () => {
    const request = BrowserActionRequestSchema.parse({
      type: "browser_action_request",
      request_id: "request-1",
      tool: "browser_read_page",
      arguments: { filter: "interactive" },
      timeout_ms: 60_000,
      session_id: "session-1",
      access: { tab_id: "tab-1", level: "read" },
    });
    expect(request.access?.tab_id).toBe("tab-1");
  });

  it("requires browser results to say what happened", () => {
    expect(() => BrowserActionResultSchema.parse({
      type: "browser_action_result",
      request_id: "request-1",
      result: {},
    })).toThrow();
  });

  it("parses explicit tab grants", () => {
    expect(TabAccessGrantSchema.parse({
      sessionId: "session-1",
      tabId: "tab-1",
      level: "interact",
      source: "user_share",
      grantedAt: "2026-08-22T12:00:00.000Z",
    }).source).toBe("user_share");
  });

  it("accepts bounded ephemeral browser observation context", () => {
    const message = AgentUserMessageSchema.parse({
      type: "user_message",
      text: "Help me with this",
      mode: "work",
      browser_context: {
        recording_id: "recording-1",
        captured_at: "2026-08-23T12:00:00.000Z",
        active_tab: { id: "tab-1", title: "Example", url: "https://example.com", access_level: "interact" },
        transcript: [{ source: "microphone", start_ms: 0, end_ms: 1200, text: "Open the first result" }],
        page_text: "Example page",
      },
    });
    expect(message.browser_context?.transcript[0]?.source).toBe("microphone");
  });

  it("rejects oversized observation transcript context", () => {
    expect(() => AgentUserMessageSchema.parse({
      type: "user_message",
      text: "Help",
      browser_context: {
        recording_id: "recording-1",
        captured_at: "2026-08-23T12:00:00.000Z",
        transcript: Array.from({ length: 7 }, (_, index) => ({
          source: "tab", start_ms: index, end_ms: index + 1, text: "x".repeat(4_000),
        })),
      },
    })).toThrow(/24,000/);
  });

  it("validates speech and local recording state", () => {
    expect(SpeechSettingsSchema.parse({
      engine: "local", language: "auto", local_model_status: "ready",
    }).engine).toBe("local");
    expect(RecordingSessionStateSchema.parse({
      status: "recording", id: "recording-1", started_at: 1, elapsed_ms: 2_000,
      sources: { tab_audio: true, microphone: true }, save_video: false,
      transcript_preview: [{
        id: "segment-1", recording_id: "recording-1", source: "microphone",
        start_ms: 0, end_ms: 1_000, text: "hello",
      }],
      transcripts: [], engine: "local",
    }).transcript_preview).toHaveLength(1);
  });
});
