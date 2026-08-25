import { describe, expect, it } from "vitest";
import {
  BrowserActionRequestSchema,
  BrowserActionResultSchema,
  AgentUserMessageSchema,
  RecordingSessionStateSchema,
  ResearchBoardRequestSchema,
  ResearchBoardResultSchema,
  SpeechSettingsSchema,
  TabAccessGrantSchema,
  browserToolNames,
  validateResearchArtifactCitations,
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

  it("validates bounded research sources and exact citations", () => {
    const source = {
      source_id: "source-1", tab_id: "tab-1", title: "Example",
      url: "https://example.com/article", captured_at: "2026-08-24T12:00:00.000Z",
      content_hash: "a".repeat(64), passages: [{ passage_id: "p1", text: "The measured result was 42." }],
    };
    const request = ResearchBoardRequestSchema.parse({
      type: "research_board_request", request_id: "research-1", prompt: "Compare the evidence",
      format: "comparison", sources: [source],
    });
    const result = ResearchBoardResultSchema.parse({
      type: "research_board_result", request_id: "research-1",
      artifact: { title: "Comparison", summary: "A cited summary.", sections: [{
        heading: "Findings", claims: [{ text: "The result was 42.", citations: [{ source_id: "source-1", passage_id: "p1" }] }],
      }] },
    });
    expect(validateResearchArtifactCitations(result.artifact, request.sources)).toBe(true);
    expect(validateResearchArtifactCitations({
      ...result.artifact,
      sections: [{ heading: "Findings", claims: [{ text: "Unsupported", citations: [{ source_id: "source-1", passage_id: "missing" }] }] }],
    }, request.sources)).toBe(false);
  });

  it("rejects oversized research evidence", () => {
    expect(() => ResearchBoardRequestSchema.parse({
      type: "research_board_request", request_id: "research-1", prompt: "Compare", format: "brief",
      sources: Array.from({ length: 10 }, (_, sourceIndex) => ({
        source_id: `source-${sourceIndex}`, tab_id: `tab-${sourceIndex}`, title: "Example",
        url: `https://example.com/${sourceIndex}`, captured_at: "2026-08-24T12:00:00.000Z",
        content_hash: "b".repeat(64), passages: Array.from({ length: 2 }, (_, passageIndex) => ({
          passage_id: `p${passageIndex}`, text: "x".repeat(7_000),
        })),
      })),
    })).toThrow(/120,000/);
  });
});
