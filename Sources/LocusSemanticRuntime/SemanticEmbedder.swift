import Foundation
import NaturalLanguage

public struct SemanticEmbedding: Codable, Equatable, Sendable {
    public let language: String
    public let revision: Int
    public let backend: String
    public let vector: [Double]

    public init(language: String, revision: Int, backend: String, vector: [Double]) {
        self.language = language
        self.revision = revision
        self.backend = backend
        self.vector = vector
    }
}

public enum SemanticEmbedder {
    public static let maximumCharacters = 64_000

    public static func embed(_ input: String, languageHint: String? = nil) -> SemanticEmbedding {
        let text = String(input.prefix(maximumCharacters)).trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else {
            return SemanticEmbedding(language: "und", revision: 0, backend: "keyword", vector: keywordVector(""))
        }
        let language = resolvedLanguage(text, hint: languageHint)
        if let embedding = NLEmbedding.sentenceEmbedding(for: language),
           let pooled = pooledVector(text, embedding: embedding), !pooled.isEmpty {
            return SemanticEmbedding(
                language: language.rawValue,
                revision: embedding.revision,
                backend: "apple-natural-language",
                vector: normalized(pooled)
            )
        }
        return SemanticEmbedding(language: language.rawValue, revision: 0, backend: "keyword", vector: keywordVector(text))
    }

    private static func resolvedLanguage(_ text: String, hint: String?) -> NLLanguage {
        if let hint, hint != "auto", !hint.isEmpty { return NLLanguage(rawValue: hint) }
        let recognizer = NLLanguageRecognizer()
        recognizer.processString(String(text.prefix(8_000)))
        return recognizer.dominantLanguage ?? .english
    }

    private static func pooledVector(_ text: String, embedding: NLEmbedding) -> [Double]? {
        let chunks = chunk(text, maximum: 1_200).prefix(8)
        var sum: [Double] = []
        var count = 0.0
        for chunk in chunks {
            guard let vector = embedding.vector(for: chunk), !vector.isEmpty else { continue }
            if sum.isEmpty { sum = Array(repeating: 0, count: vector.count) }
            guard sum.count == vector.count else { continue }
            for index in vector.indices { sum[index] += vector[index] }
            count += 1
        }
        guard count > 0 else { return nil }
        return sum.map { $0 / count }
    }

    private static func chunk(_ text: String, maximum: Int) -> [String] {
        var result: [String] = []
        var current = ""
        text.enumerateSubstrings(in: text.startIndex..<text.endIndex, options: [.bySentences, .substringNotRequired]) { _, range, _, _ in
            let sentence = String(text[range]).trimmingCharacters(in: .whitespacesAndNewlines)
            guard !sentence.isEmpty else { return }
            if current.count + sentence.count + 1 > maximum, !current.isEmpty {
                result.append(current)
                current = ""
            }
            if sentence.count > maximum {
                result.append(String(sentence.prefix(maximum)))
            } else {
                current += current.isEmpty ? sentence : " \(sentence)"
            }
        }
        if !current.isEmpty { result.append(current) }
        if result.isEmpty { result.append(String(text.prefix(maximum))) }
        return result
    }

    private static func keywordVector(_ text: String) -> [Double] {
        var vector = Array(repeating: 0.0, count: 256)
        let words = text.lowercased().split { !$0.isLetter && !$0.isNumber }
        for word in words {
            var hash: UInt64 = 14_695_981_039_346_656_037
            for byte in word.utf8 { hash = (hash ^ UInt64(byte)) &* 1_099_511_628_211 }
            let index = Int(hash % UInt64(vector.count))
            vector[index] += 1
        }
        return normalized(vector)
    }

    private static func normalized(_ vector: [Double]) -> [Double] {
        let magnitude = sqrt(vector.reduce(0) { $0 + $1 * $1 })
        guard magnitude > 0 else { return vector }
        return vector.map { $0 / magnitude }
    }
}
