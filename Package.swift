// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "LocusProtocol",
    platforms: [.macOS(.v14)],
    products: [.library(name: "LocusProtocol", targets: ["LocusProtocol"])],
    targets: [
        .target(name: "LocusProtocol"),
        .testTarget(name: "LocusProtocolTests", dependencies: ["LocusProtocol"]),
    ]
)
