import Foundation
import Testing
@testable import LocusProtocol

@Test func browserToolParityIsStable() {
    #expect(BrowserToolName.allCases.count == 13)
    #expect(BrowserToolName.readPage.rawValue == "browser_read_page")
    #expect(BrowserToolName.devServer.rawValue == "browser_dev_server")
}

@Test func requestUsesWireCompatibleSnakeCase() throws {
    let request = BrowserActionRequest(
        requestId: "request-1", tool: .readPage,
        arguments: ["filter": .string("interactive")], timeoutMs: 60_000,
        sessionId: "session-1", access: BrowserAccessMetadata(tabId: "tab-1", level: .read)
    )
    let object = try #require(JSONSerialization.jsonObject(with: JSONEncoder().encode(request)) as? [String: Any])
    #expect(object["request_id"] as? String == "request-1")
    #expect(object["session_id"] as? String == "session-1")
    #expect((object["access"] as? [String: Any])?["tab_id"] as? String == "tab-1")
}
