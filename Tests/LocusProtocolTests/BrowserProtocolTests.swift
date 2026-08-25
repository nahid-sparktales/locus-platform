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

@Test func liveBrowserContextUsesBoundedWireShape() throws {
    let message = AgentUserMessage(
        text: "Help me with this", mode: "work",
        browserContext: BrowserObservationContext(
            recordingId: "recording-1", capturedAt: "2026-08-23T12:00:00.000Z",
            activeTab: BrowserObservationTab(
                id: "tab-1", title: "Example", url: "https://example.com", accessLevel: .interact
            ),
            transcript: [
                RecordingTranscriptSegment(
                    source: .microphone, startMs: 0, endMs: 1200, text: "Open the first result"
                )
            ],
            pageText: "Example page"
        )
    )
    let object = try #require(JSONSerialization.jsonObject(with: JSONEncoder().encode(message)) as? [String: Any])
    let context = try #require(object["browser_context"] as? [String: Any])
    #expect(context["recording_id"] as? String == "recording-1")
    #expect((context["active_tab"] as? [String: Any])?["access_level"] as? String == "interact")
}

@Test func recordingStateUsesGeneratedSnakeCase() throws {
    let state = RecordingSessionState(
        status: .recording, id: "recording-1", startedAt: 1, elapsedMs: 2_000,
        sources: RecordingSourceState(tabAudio: true, microphone: true), saveVideo: false,
        transcriptPreview: [TranscriptSegment(
            id: "segment-1", recordingId: "recording-1", source: .microphone,
            startMs: 0, endMs: 1_000, text: "hello"
        )], engine: .local
    )
    let object = try #require(JSONSerialization.jsonObject(with: JSONEncoder().encode(state)) as? [String: Any])
    #expect(object["elapsed_ms"] as? Int == 2_000)
    #expect((object["sources"] as? [String: Any])?["tab_audio"] as? Bool == true)
}

@Test func researchBoardUsesExactSourcePassageCitations() throws {
    let source = ResearchSource(
        sourceId: "source-1", tabId: "tab-1", title: "Example",
        url: "https://example.com/article", capturedAt: "2026-08-24T12:00:00.000Z",
        contentHash: String(repeating: "a", count: 64),
        passages: [ResearchPassage(passageId: "p1", text: "The measured result was 42.")]
    )
    let artifact = ResearchArtifact(
        title: "Comparison", summary: "A cited summary.",
        sections: [ResearchSection(
            heading: "Findings",
            claims: [ResearchClaim(
                text: "The result was 42.",
                citations: [ResearchCitation(sourceId: "source-1", passageId: "p1")]
            )]
        )]
    )
    #expect(artifact.citationsAreValid(for: [source]))
    let request = ResearchBoardRequest(requestId: "research-1", prompt: "Compare", format: .comparison, sources: [source])
    let object = try #require(JSONSerialization.jsonObject(with: JSONEncoder().encode(request)) as? [String: Any])
    #expect(object["request_id"] as? String == "research-1")
    #expect(((object["sources"] as? [[String: Any]])?.first)?["source_id"] as? String == "source-1")
}
