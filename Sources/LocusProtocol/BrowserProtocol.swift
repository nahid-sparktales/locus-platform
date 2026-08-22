// Generated from schemas/browser-wire.schema.json. Do not add app policy here;
// authorization belongs to the native browser broker.
import Foundation

public enum BrowserToolName: String, Codable, CaseIterable, Sendable {
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
