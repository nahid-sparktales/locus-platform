import Foundation
import LocusSemanticRuntime

private struct Request: Decodable {
    let id: String
    let text: String
    let language: String?
}

private struct Response: Encodable {
    let id: String
    let embedding: SemanticEmbedding?
    let error: String?
}

private let encoder = JSONEncoder()
private let decoder = JSONDecoder()

while let line = readLine() {
    let response: Response
    do {
        guard let data = line.data(using: .utf8), data.count <= 512_000 else {
            throw NSError(domain: "LocusSemanticHelper", code: 1, userInfo: [NSLocalizedDescriptionKey: "Request is too large"])
        }
        let request = try decoder.decode(Request.self, from: data)
        guard !request.id.isEmpty, request.id.count <= 255 else {
            throw NSError(domain: "LocusSemanticHelper", code: 2, userInfo: [NSLocalizedDescriptionKey: "Request id is invalid"])
        }
        response = Response(id: request.id, embedding: SemanticEmbedder.embed(request.text, languageHint: request.language), error: nil)
    } catch {
        response = Response(id: "unknown", embedding: nil, error: error.localizedDescription)
    }
    if let data = try? encoder.encode(response), let output = String(data: data, encoding: .utf8) {
        print(output)
        fflush(stdout)
    }
}
