#pragma once

#include "graph/Graph.h"
#include "benchmark/GraphGenerator.h"
#include <string>
#include <vector>
#include <optional>
#include <nlohmann/json.hpp>

struct BenchmarkAlgorithmConfig {
    std::string algorithm; // "dijkstra", "astar", "bfs", "dfs"
    std::string heuristic{"euclidean"}; // "euclidean", "manhattan", "zero"
};

struct BenchmarkAlgorithmMetrics {
    std::string algorithm;
    std::string heuristic;
    int runs{0};
    double minTimeMs{0.0};
    double maxTimeMs{0.0};
    double avgTimeMs{0.0};
    double stdDevTimeMs{0.0};
    double avgNodesVisited{0.0};
    double avgEdgesExamined{0.0};
    double avgEdgeRelaxations{0.0};
    std::optional<double> pathCost{std::nullopt};
    bool found{false};
};

struct BenchmarkSuiteResult {
    int nodeCount{0};
    int edgeCount{0};
    std::string topology{"custom"};
    bool directed{false};
    bool weighted{true};
    uint64_t seed{0};
    std::string source;
    std::string target;
    int runs{0};
    std::vector<BenchmarkAlgorithmMetrics> results;
    bool costMatch{true};
    std::string fastest;
    std::string fewestVisited;
};

class Benchmark {
public:
    static BenchmarkSuiteResult runSuite(
        const Graph& graph,
        const std::string& source,
        const std::string& target,
        const std::vector<BenchmarkAlgorithmConfig>& algorithms,
        int runs = 5,
        const std::string& topology = "custom",
        uint64_t seed = 0
    );

    static nlohmann::json processBenchmark(const nlohmann::json& requestJson);
    static nlohmann::json toJson(const BenchmarkSuiteResult& suite);
};
