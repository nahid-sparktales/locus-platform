import Testing
@testable import LocusSemanticRuntime

@Test func semanticEmbeddingIsNormalizedAndDeterministic() {
    let first = SemanticEmbedder.embed("A local-first browser keeps private data on this Mac.", languageHint: "en")
    let second = SemanticEmbedder.embed("A local-first browser keeps private data on this Mac.", languageHint: "en")
    #expect(first.vector == second.vector)
    #expect(!first.vector.isEmpty)
    let magnitude = first.vector.reduce(0.0) { $0 + $1 * $1 }.squareRoot()
    #expect(abs(magnitude - 1) < 0.0001)
}

@Test func semanticEmbeddingBoundsLargeInput() {
    let result = SemanticEmbedder.embed(String(repeating: "browser evidence ", count: 10_000), languageHint: "en")
    #expect(!result.vector.isEmpty)
}
