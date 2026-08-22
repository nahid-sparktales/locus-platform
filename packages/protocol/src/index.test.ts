import { describe, expect, it } from "vitest";
import {
  BrowserActionRequestSchema,
  BrowserActionResultSchema,
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
});
