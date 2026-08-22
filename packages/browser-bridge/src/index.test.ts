import { describe, expect, it } from "vitest";
import { bridgeInvocation, browserBridgeSource } from "./index.js";

describe("isolated browser bridge", () => {
  it("contains credential and payment protections", () => {
    expect(browserBridgeSource).toContain("protected credential or payment data");
    expect(browserBridgeSource).toContain("one-time-code");
    expect(browserBridgeSource).toContain("data-locus-protected-cover");
    expect(browserBridgeSource).toContain("focusedSensitive");
    expect(browserBridgeSource).not.toContain("ipcRenderer");
  });

  it("escapes invocation values as JSON", () => {
    const call = bridgeInvocation.setValue("e1-'", "hello </script>");
    expect(call).toContain(JSON.stringify("e1-'"));
    expect(call).toContain(JSON.stringify("hello </script>"));
  });
});
