// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "LocusProtocol",
    platforms: [.macOS(.v14)],
    products: [
        .library(name: "LocusProtocol", targets: ["LocusProtocol"]),
        .library(name: "LocusSemanticRuntime", targets: ["LocusSemanticRuntime"]),
        .executable(name: "locus-semantic-helper", targets: ["LocusSemanticHelper"]),
    ],
    targets: [
        .target(name: "LocusProtocol"),
        .target(name: "LocusSemanticRuntime"),
        .executableTarget(name: "LocusSemanticHelper", dependencies: ["LocusSemanticRuntime"]),
        .testTarget(name: "LocusProtocolTests", dependencies: ["LocusProtocol"]),
        .testTarget(name: "LocusSemanticRuntimeTests", dependencies: ["LocusSemanticRuntime"]),
    ]
)
