// Generated from schemas/browser-wire.schema.json. Do not add app policy here;
// authorization belongs to the native browser broker.
import Foundation

public enum BrowserToolName: String, Codable, CaseIterable, Sendable {
    case history = "browser_history"
    case readPage = "browser_read_page"
    case getText = "browser_get_text"
    case find = "browser_find"
    case navigate = "browser_navigate"
    case tabs = "browser_tabs"
    case input = "browser_input"
    case screenshot = "browser_screenshot"
    case waitFor = "browser_wait_for"
    case console = "browser_console"
    case network = "browser_network"
    case resize = "browser_resize"
    case javascript = "browser_javascript"
    case devServer = "browser_dev_server"
}

public struct SetBrowserControl: Codable, Equatable, Sendable {
    public let type: String
    public let enabled: Bool
    public let historyEnabled: Bool?

    public init(enabled: Bool, historyEnabled: Bool? = nil) {
        self.type = "set_browser_control"; self.enabled = enabled
        self.historyEnabled = historyEnabled
    }

    private enum CodingKeys: String, CodingKey {
        case type, enabled; case historyEnabled = "history_enabled"
    }
}

public enum TabAccessLevel: String, Codable, Sendable { case read, interact }
public enum TabAccessSource: String, Codable, Sendable {
    case userShare = "user_share"
    case agentCreated = "agent_created"
}

public struct TabAccessGrant: Codable, Equatable, Sendable {
    public let sessionId: String
    public let tabId: String
    public let level: TabAccessLevel
    public let source: TabAccessSource
    public let grantedAt: String

    public init(sessionId: String, tabId: String, level: TabAccessLevel, source: TabAccessSource, grantedAt: String) {
        self.sessionId = sessionId; self.tabId = tabId; self.level = level
        self.source = source; self.grantedAt = grantedAt
    }
}

public struct BrowserAccessMetadata: Codable, Equatable, Sendable {
    public let tabId: String?
    public let level: TabAccessLevel?
    public let source: TabAccessSource?

    public init(tabId: String? = nil, level: TabAccessLevel? = nil, source: TabAccessSource? = nil) {
        self.tabId = tabId; self.level = level; self.source = source
    }

    private enum CodingKeys: String, CodingKey { case tabId = "tab_id"; case level, source }
}

public enum JSONValue: Codable, Equatable, Sendable {
    case string(String), number(Double), boolean(Bool)
    case object([String: JSONValue]), array([JSONValue]), null

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() { self = .null }
        else if let value = try? container.decode(Bool.self) { self = .boolean(value) }
        else if let value = try? container.decode(Double.self) { self = .number(value) }
        else if let value = try? container.decode(String.self) { self = .string(value) }
        else if let value = try? container.decode([String: JSONValue].self) { self = .object(value) }
        else { self = .array(try container.decode([JSONValue].self)) }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value): try container.encode(value)
        case .number(let value): try container.encode(value)
        case .boolean(let value): try container.encode(value)
        case .object(let value): try container.encode(value)
        case .array(let value): try container.encode(value)
        case .null: try container.encodeNil()
        }
    }
}

public struct BrowserActionRequest: Codable, Equatable, Sendable {
    public let type: String
    public let requestId: String
    public let tool: BrowserToolName
    public let arguments: [String: JSONValue]
    public let timeoutMs: Int
    public let sessionId: String
    public let access: BrowserAccessMetadata?

    public init(requestId: String, tool: BrowserToolName, arguments: [String: JSONValue], timeoutMs: Int, sessionId: String, access: BrowserAccessMetadata? = nil) {
        self.type = "browser_action_request"; self.requestId = requestId; self.tool = tool
        self.arguments = arguments; self.timeoutMs = timeoutMs; self.sessionId = sessionId; self.access = access
    }

    private enum CodingKeys: String, CodingKey {
        case type, tool, arguments, access
        case requestId = "request_id"; case timeoutMs = "timeout_ms"; case sessionId = "session_id"
    }
}

public struct ScreenshotPayload: Codable, Equatable, Sendable {
    public let mimeType: String
    public let data: String
    public let description: String
    public init(data: String, description: String) { self.mimeType = "image/png"; self.data = data; self.description = description }
    private enum CodingKeys: String, CodingKey { case mimeType = "mime_type"; case data, description }
}

public struct BrowserActionPayload: Codable, Equatable, Sendable {
    public let text: String?
    public let error: String?
    public let screenshot: ScreenshotPayload?
    public init(text: String? = nil, error: String? = nil, screenshot: ScreenshotPayload? = nil) {
        precondition(text != nil || error != nil, "A browser result must contain text or error")
        self.text = text; self.error = error; self.screenshot = screenshot
    }
}

public struct BrowserActionResult: Codable, Equatable, Sendable {
    public let type: String
    public let requestId: String
    public let result: BrowserActionPayload
    public init(requestId: String, result: BrowserActionPayload) { self.type = "browser_action_result"; self.requestId = requestId; self.result = result }
    private enum CodingKeys: String, CodingKey { case type, result; case requestId = "request_id" }
}

public enum WalletToolName: String, Codable, CaseIterable, Sendable {
    case listAccounts = "wallet_list_accounts"
    case getBalance = "wallet_get_balance"
    case getActivity = "wallet_get_activity"
    case prepareTransaction = "wallet_prepare_transaction"
    case simulateTransaction = "wallet_simulate_transaction"
    case executeTransaction = "wallet_execute_transaction"
    case lock = "wallet_lock"
}

public struct SetWalletControl: Codable, Equatable, Sendable {
    public let type: String
    public let enabled: Bool

    public init(enabled: Bool) {
        self.type = "set_wallet_control"; self.enabled = enabled
    }
}

public struct WalletActionRequest: Codable, Equatable, Sendable {
    public let type: String
    public let requestId: String
    public let tool: WalletToolName
    public let arguments: [String: JSONValue]
    public let timeoutMs: Int
    public let sessionId: String

    public init(requestId: String, tool: WalletToolName, arguments: [String: JSONValue], timeoutMs: Int, sessionId: String) {
        self.type = "wallet_action_request"; self.requestId = requestId; self.tool = tool
        self.arguments = arguments; self.timeoutMs = timeoutMs; self.sessionId = sessionId
    }

    private enum CodingKeys: String, CodingKey {
        case type, tool, arguments
        case requestId = "request_id"; case timeoutMs = "timeout_ms"; case sessionId = "session_id"
    }
}

public struct WalletActionPayload: Codable, Equatable, Sendable {
    public let text: String?
    public let error: String?

    public init(text: String? = nil, error: String? = nil) {
        precondition(text != nil || error != nil, "A wallet result must contain text or error")
        self.text = text; self.error = error
    }
}

public struct WalletActionResult: Codable, Equatable, Sendable {
    public let type: String
    public let requestId: String
    public let result: WalletActionPayload

    public init(requestId: String, result: WalletActionPayload) {
        self.type = "wallet_action_result"; self.requestId = requestId; self.result = result
    }

    private enum CodingKeys: String, CodingKey { case type, result; case requestId = "request_id" }
}

public enum RecordingTranscriptSource: String, Codable, Sendable { case tab, microphone }

public struct RecordingTranscriptSegment: Codable, Equatable, Sendable {
    public let source: RecordingTranscriptSource
    public let startMs: Int
    public let endMs: Int
    public let text: String
    public let tabId: String?

    public init(source: RecordingTranscriptSource, startMs: Int, endMs: Int, text: String, tabId: String? = nil) {
        self.source = source; self.startMs = startMs; self.endMs = endMs
        self.text = text; self.tabId = tabId
    }

    private enum CodingKeys: String, CodingKey {
        case source, text
        case startMs = "start_ms"; case endMs = "end_ms"; case tabId = "tab_id"
    }
}

public enum SpeechEngine: String, Codable, Sendable { case local, openai, custom }
public enum LocalSpeechModelStatus: String, Codable, Sendable { case missing, downloading, ready, error }

public struct SpeechSettings: Codable, Equatable, Sendable {
    public let engine: SpeechEngine
    public let language: String
    public let customBaseURL: String?
    public let customModel: String?
    public let localModelStatus: LocalSpeechModelStatus
    public let localModelProgress: Double?
    public let message: String?

    public init(engine: SpeechEngine, language: String, customBaseURL: String? = nil, customModel: String? = nil, localModelStatus: LocalSpeechModelStatus, localModelProgress: Double? = nil, message: String? = nil) {
        self.engine = engine; self.language = language; self.customBaseURL = customBaseURL
        self.customModel = customModel; self.localModelStatus = localModelStatus
        self.localModelProgress = localModelProgress; self.message = message
    }

    private enum CodingKeys: String, CodingKey {
        case engine, language, message
        case customBaseURL = "custom_base_url"; case customModel = "custom_model"
        case localModelStatus = "local_model_status"; case localModelProgress = "local_model_progress"
    }
}

public struct RecordingSourceState: Codable, Equatable, Sendable {
    public let tabAudio: Bool
    public let microphone: Bool
    public init(tabAudio: Bool, microphone: Bool) { self.tabAudio = tabAudio; self.microphone = microphone }
    private enum CodingKeys: String, CodingKey { case tabAudio = "tab_audio"; case microphone }
}

public struct TranscriptSegment: Codable, Equatable, Sendable {
    public let id: String
    public let recordingId: String
    public let source: RecordingTranscriptSource
    public let startMs: Int
    public let endMs: Int
    public let text: String
    public let tabId: String?

    public init(id: String, recordingId: String, source: RecordingTranscriptSource, startMs: Int, endMs: Int, text: String, tabId: String? = nil) {
        self.id = id; self.recordingId = recordingId; self.source = source
        self.startMs = startMs; self.endMs = endMs; self.text = text; self.tabId = tabId
    }

    private enum CodingKeys: String, CodingKey {
        case id, source, text; case recordingId = "recording_id"
        case startMs = "start_ms"; case endMs = "end_ms"; case tabId = "tab_id"
    }
}

public struct RecordingTranscriptSummary: Codable, Equatable, Sendable {
    public let id: String
    public let workSessionId: String
    public let startedAt: Int
    public let endedAt: Int?
    public let durationMs: Int
    public let segmentCount: Int
    public let videoPath: String?

    public init(id: String, workSessionId: String, startedAt: Int, endedAt: Int? = nil, durationMs: Int, segmentCount: Int, videoPath: String? = nil) {
        self.id = id; self.workSessionId = workSessionId; self.startedAt = startedAt
        self.endedAt = endedAt; self.durationMs = durationMs
        self.segmentCount = segmentCount; self.videoPath = videoPath
    }

    private enum CodingKeys: String, CodingKey {
        case id; case workSessionId = "work_session_id"; case startedAt = "started_at"
        case endedAt = "ended_at"; case durationMs = "duration_ms"
        case segmentCount = "segment_count"; case videoPath = "video_path"
    }
}

public enum RecordingStatus: String, Codable, Sendable { case idle, starting, recording, paused, stopping, error }

public struct RecordingSessionState: Codable, Equatable, Sendable {
    public let status: RecordingStatus
    public let id: String?
    public let startedAt: Int?
    public let elapsedMs: Int
    public let sources: RecordingSourceState
    public let saveVideo: Bool
    public let activeTabId: String?
    public let pausedReason: String?
    public let transcriptPreview: [TranscriptSegment]
    public let transcripts: [RecordingTranscriptSummary]
    public let engine: SpeechEngine
    public let error: String?

    public init(status: RecordingStatus, id: String? = nil, startedAt: Int? = nil, elapsedMs: Int, sources: RecordingSourceState, saveVideo: Bool, activeTabId: String? = nil, pausedReason: String? = nil, transcriptPreview: [TranscriptSegment] = [], transcripts: [RecordingTranscriptSummary] = [], engine: SpeechEngine, error: String? = nil) {
        self.status = status; self.id = id; self.startedAt = startedAt; self.elapsedMs = elapsedMs
        self.sources = sources; self.saveVideo = saveVideo; self.activeTabId = activeTabId
        self.pausedReason = pausedReason; self.transcriptPreview = transcriptPreview
        self.transcripts = transcripts; self.engine = engine; self.error = error
    }

    private enum CodingKeys: String, CodingKey {
        case status, id, sources, engine, error; case startedAt = "started_at"
        case elapsedMs = "elapsed_ms"; case saveVideo = "save_video"
        case activeTabId = "active_tab_id"; case pausedReason = "paused_reason"
        case transcriptPreview = "transcript_preview"; case transcripts
    }
}

public struct BrowserObservationFrame: Codable, Equatable, Sendable {
    public let capturedAt: String
    public let mimeType: String
    public let data: String
    public let description: String

    public init(capturedAt: String, mimeType: String, data: String, description: String) {
        self.capturedAt = capturedAt; self.mimeType = mimeType
        self.data = data; self.description = description
    }

    private enum CodingKeys: String, CodingKey {
        case data, description
        case capturedAt = "captured_at"; case mimeType = "mime_type"
    }
}

public struct BrowserObservationTab: Codable, Equatable, Sendable {
    public let id: String
    public let title: String
    public let url: String
    public let accessLevel: TabAccessLevel

    public init(id: String, title: String, url: String, accessLevel: TabAccessLevel) {
        self.id = id; self.title = title; self.url = url; self.accessLevel = accessLevel
    }

    private enum CodingKeys: String, CodingKey {
        case id, title, url
        case accessLevel = "access_level"
    }
}

public struct BrowserObservationContext: Codable, Equatable, Sendable {
    public let recordingId: String
    public let capturedAt: String
    public let activeTab: BrowserObservationTab?
    public let transcript: [RecordingTranscriptSegment]
    public let pageText: String?
    public let frames: [BrowserObservationFrame]
    public let pausedReason: String?

    public init(recordingId: String, capturedAt: String, activeTab: BrowserObservationTab? = nil, transcript: [RecordingTranscriptSegment] = [], pageText: String? = nil, frames: [BrowserObservationFrame] = [], pausedReason: String? = nil) {
        self.recordingId = recordingId; self.capturedAt = capturedAt; self.activeTab = activeTab
        self.transcript = transcript; self.pageText = pageText; self.frames = frames
        self.pausedReason = pausedReason
    }

    private enum CodingKeys: String, CodingKey {
        case transcript, frames
        case recordingId = "recording_id"; case capturedAt = "captured_at"
        case activeTab = "active_tab"; case pageText = "page_text"; case pausedReason = "paused_reason"
    }
}

public struct PortableMemoryRecord: Codable, Equatable, Sendable {
    public let blobId: String
    public let text: String
    public let title: String?
    public let sourceURL: String?
    public let capturedAt: String?
    public let contentSHA256: String?

    public init(blobId: String, text: String, title: String? = nil, sourceURL: String? = nil, capturedAt: String? = nil, contentSHA256: String? = nil) {
        self.blobId = blobId; self.text = text; self.title = title
        self.sourceURL = sourceURL; self.capturedAt = capturedAt
        self.contentSHA256 = contentSHA256
    }

    private enum CodingKeys: String, CodingKey {
        case text, title; case blobId = "blob_id"; case sourceURL = "source_url"
        case capturedAt = "captured_at"; case contentSHA256 = "content_sha256"
    }
}

public struct AgentUserMessage: Codable, Equatable, Sendable {
    public let type: String
    public let text: String
    public let mode: String?
    public let browserContext: BrowserObservationContext?
    public let portableMemory: [PortableMemoryRecord]?

    public init(text: String, mode: String? = nil, browserContext: BrowserObservationContext? = nil, portableMemory: [PortableMemoryRecord]? = nil) {
        self.type = "user_message"; self.text = text; self.mode = mode
        self.browserContext = browserContext; self.portableMemory = portableMemory
    }

    private enum CodingKeys: String, CodingKey {
        case type, text, mode
        case browserContext = "browser_context"; case portableMemory = "portable_memory"
    }
}

public struct ResearchPassage: Codable, Equatable, Sendable {
    public let passageId: String
    public let text: String

    public init(passageId: String, text: String) {
        self.passageId = passageId; self.text = text
    }

    private enum CodingKeys: String, CodingKey { case passageId = "passage_id"; case text }
}

public struct ResearchSource: Codable, Equatable, Sendable {
    public let sourceId: String
    public let tabId: String
    public let title: String
    public let url: String
    public let capturedAt: String
    public let contentHash: String
    public let passages: [ResearchPassage]

    public init(sourceId: String, tabId: String, title: String, url: String, capturedAt: String, contentHash: String, passages: [ResearchPassage]) {
        self.sourceId = sourceId; self.tabId = tabId; self.title = title; self.url = url
        self.capturedAt = capturedAt; self.contentHash = contentHash; self.passages = passages
    }

    private enum CodingKeys: String, CodingKey {
        case title, url, passages
        case sourceId = "source_id"; case tabId = "tab_id"
        case capturedAt = "captured_at"; case contentHash = "content_hash"
    }
}

public struct ResearchCitation: Codable, Equatable, Hashable, Sendable {
    public let sourceId: String
    public let passageId: String

    public init(sourceId: String, passageId: String) {
        self.sourceId = sourceId; self.passageId = passageId
    }

    private enum CodingKeys: String, CodingKey { case sourceId = "source_id"; case passageId = "passage_id" }
}

public struct ResearchClaim: Codable, Equatable, Sendable {
    public let text: String
    public let citations: [ResearchCitation]
    public init(text: String, citations: [ResearchCitation]) { self.text = text; self.citations = citations }
}

public struct ResearchSection: Codable, Equatable, Sendable {
    public let heading: String
    public let claims: [ResearchClaim]
    public init(heading: String, claims: [ResearchClaim]) { self.heading = heading; self.claims = claims }
}

public struct ResearchArtifact: Codable, Equatable, Sendable {
    public let title: String
    public let summary: String
    public let sections: [ResearchSection]
    public init(title: String, summary: String, sections: [ResearchSection]) {
        self.title = title; self.summary = summary; self.sections = sections
    }

    public func citationsAreValid(for sources: [ResearchSource]) -> Bool {
        let known = Set(sources.flatMap { source in
            source.passages.map { "\(source.sourceId):\($0.passageId)" }
        })
        return sections.allSatisfy { section in
            section.claims.allSatisfy { claim in
                !claim.citations.isEmpty && claim.citations.allSatisfy {
                    known.contains("\($0.sourceId):\($0.passageId)")
                }
            }
        }
    }
}

public enum ResearchBoardFormat: String, Codable, Sendable { case comparison, brief, evidence }

public struct ResearchBoardRequest: Codable, Equatable, Sendable {
    public let type: String
    public let requestId: String
    public let prompt: String
    public let format: ResearchBoardFormat
    public let sources: [ResearchSource]

    public init(requestId: String, prompt: String, format: ResearchBoardFormat, sources: [ResearchSource]) {
        self.type = "research_board_request"; self.requestId = requestId
        self.prompt = prompt; self.format = format; self.sources = sources
    }

    private enum CodingKeys: String, CodingKey {
        case type, prompt, format, sources; case requestId = "request_id"
    }
}

public struct ResearchBoardProgress: Codable, Equatable, Sendable {
    public let type: String
    public let requestId: String
    public let message: String
    public init(requestId: String, message: String) {
        self.type = "research_board_progress"; self.requestId = requestId; self.message = message
    }
    private enum CodingKeys: String, CodingKey { case type, message; case requestId = "request_id" }
}

public struct ResearchBoardResult: Codable, Equatable, Sendable {
    public let type: String
    public let requestId: String
    public let artifact: ResearchArtifact
    public init(requestId: String, artifact: ResearchArtifact) {
        self.type = "research_board_result"; self.requestId = requestId; self.artifact = artifact
    }
    private enum CodingKeys: String, CodingKey { case type, artifact; case requestId = "request_id" }
}

public struct ResearchBoardError: Codable, Equatable, Sendable {
    public let type: String
    public let requestId: String
    public let error: String
    public init(requestId: String, error: String) {
        self.type = "research_board_error"; self.requestId = requestId; self.error = error
    }
    private enum CodingKeys: String, CodingKey { case type, error; case requestId = "request_id" }
}
