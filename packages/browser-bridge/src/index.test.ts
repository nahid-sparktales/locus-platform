import { describe, expect, it } from "vitest";
import { bridgeInvocation, browserBridgeSource } from "./index.js";

describe("isolated browser bridge", () => {
  it("contains credential and payment protections", () => {
    expect(browserBridgeSource).toContain("protected credential or payment data");
    expect(browserBridgeSource).toContain("one-time-code");
    expect(browserBridgeSource).toContain("protectedCategory");
    expect(browserBridgeSource).toContain("securityCode");
    expect(browserBridgeSource).toContain("paymentCard");
    expect(browserBridgeSource).toContain("data-locus-protected-cover");
    expect(browserBridgeSource).toContain("focusedSensitive");
    expect(browserBridgeSource).toContain("protectedRects");
    expect(browserBridgeSource).toContain("safeText");
    expect(browserBridgeSource).toContain("strictSnapshot");
    expect(browserBridgeSource).toContain("readerArticle");
    expect(browserBridgeSource).toContain("readerDocument");
    expect(browserBridgeSource).toContain("[contenteditable]");
    expect(browserBridgeSource).toContain("iframe, frame");
    expect(browserBridgeSource).not.toContain("ipcRenderer");
  });

  it("exposes a host-only protected rectangle invocation", () => {
    expect(bridgeInvocation.protectedRects()).toBe("globalThis.__locusBrowserBridge.protectedRects()");
  });

  it("exposes host-only strict recall and reader invocations", () => {
    expect(bridgeInvocation.strictSnapshot({ maxChars: 1_000 })).toContain("strictSnapshot");
    expect(bridgeInvocation.readerArticle()).toBe("globalThis.__locusBrowserBridge.readerArticle({})");
    expect(bridgeInvocation.readerDocument({ maxHtmlChars: 3_000 })).toContain("readerDocument");
  });

  it("escapes invocation values as JSON", () => {
    const call = bridgeInvocation.setValue(
      "e1-'", "hello </script>", ["password", "paymentCard"],
    );
    expect(call).toContain(JSON.stringify("e1-'"));
    expect(call).toContain(JSON.stringify("hello </script>"));
    expect(call).toContain(JSON.stringify(["password", "paymentCard"]));
  });
});
