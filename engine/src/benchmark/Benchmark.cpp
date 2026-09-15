#include "benchmark/Benchmark.h"
#include "algorithm/BFS.h"
#include "algorithm/DFS.h"
#include "algorithm/Dijkstra.h"
#include "algorithm/AStar.h"
#include "algorithm/Heuristics.h"
#include <chrono>
#include <cmath>
#include <numeric>
#include <limits>
#include <algorithm>
#include <stdexcept>

namespace {

double round4Dec(double val) {
    return std::round(val * 10000.0) / 10000.0;
}

std::string toLower(std::string str) {
    std::transform(str.begin(), str.end(), str.begin(), ::tolower);
    return str;
}

} // namespace

BenchmarkSuiteResult Benchmark::runSuite(
    const Graph& graph,
    const std::string& source,
    const std::string& target,
    const std::vector<BenchmarkAlgorithmConfig>& algorithms,
    int runs,
    const std::string& topology,
    uint64_t seed
) {
    if (runs < 1) runs = 1;
    if (!graph.hasNode(source)) {
        throw std::out_of_range("Source node '" + source + "' does not exist in graph.");
    }
    if (!graph.hasNode(target)) {
        throw std::out_of_range("Target node '" + target + "' does not exist in graph.");
    }

    BenchmarkSuiteResult suite;
    suite.nodeCount = static_cast<int>(graph.getVertexCount());
    suite.edgeCount = static_cast<int>(graph.getEdgeCount());
    suite.topology = topology;
    suite.directed = graph.isDirected();
    suite.weighted = graph.isWeighted();
    suite.seed = seed;
    suite.source = source;
    suite.target = target;
    suite.runs = runs;
    suite.costMatch = true;

    double fastestTime = std::numeric_limits<double>::infinity();
    double minVisited = std::numeric_limits<double>::infinity();

    std::optional<double> dijkstraCost;
    std::optional<double> astarCost;

    for (const auto& algConfig : algorithms) {
        std::string alg = toLower(algConfig.algorithm);
        HeuristicType hType = HeuristicType::EUCLIDEAN;
        if (alg == "astar") {
            std::string hName = algConfig.heuristic.empty() ? "euclidean" : algConfig.heuristic;
            hType = Heuristics::fromString(hName);
        }

        // 1. Warm-up pass to prime CPU cache & instruction cache
        try {
            if (alg == "bfs") {
                BFS::run(graph, source, target, AlgorithmOptions(false));
            } else if (alg == "dfs") {
                DFS::run(graph, source, target, AlgorithmOptions(false));
            } else if (alg == "dijkstra") {
                Dijkstra::run(graph, source, target, AlgorithmOptions(false));
            } else if (alg == "astar") {
                AStar::run(graph, source, target, AStarOptions(false, hType));
            }
        } catch (...) {
            // Ignore warm-up failure if endpoints disconnected
        }

        // 2. Multi-run timing execution
        std::vector<double> times;
        times.reserve(runs);
        double totalNodes = 0.0;
        double totalEdges = 0.0;
        double totalRelax = 0.0;
        std::optional<double> lastCost;
        bool lastFound = false;

        for (int i = 0; i < runs; ++i) {
            auto start = std::chrono::high_resolution_clock::now();
            AlgorithmResult res;
            if (alg == "bfs") {
                res = BFS::run(graph, source, target, AlgorithmOptions(false));
            } else if (alg == "dfs") {
                res = DFS::run(graph, source, target, AlgorithmOptions(false));
            } else if (alg == "dijkstra") {
                res = Dijkstra::run(graph, source, target, AlgorithmOptions(false));
            } else if (alg == "astar") {
                res = AStar::run(graph, source, target, AStarOptions(false, hType));
            } else {
                throw std::invalid_argument("Unsupported algorithm: " + alg);
            }
            auto end = std::chrono::high_resolution_clock::now();

            double elapsedMs = std::chrono::duration<double, std::milli>(end - start).count();
            times.push_back(elapsedMs);

            totalNodes += res.metrics.nodesVisited;
            totalEdges += res.metrics.edgesExamined;
            totalRelax += res.metrics.edgeRelaxations;
            lastCost = res.cost;
            lastFound = res.found;
        }

        double minTime = *std::min_element(times.begin(), times.end());
        double maxTime = *std::max_element(times.begin(), times.end());
        double sum = std::accumulate(times.begin(), times.end(), 0.0);
        double mean = sum / runs;

        double variance = 0.0;
        for (double t : times) {
            variance += (t - mean) * (t - mean);
        }
        double stdDev = runs > 1 ? std::sqrt(variance / runs) : 0.0;

        BenchmarkAlgorithmMetrics metrics;
        metrics.algorithm = alg;
        metrics.heuristic = (alg == "astar" ? algConfig.heuristic : "");
        metrics.runs = runs;
        metrics.minTimeMs = round4Dec(minTime);
        metrics.maxTimeMs = round4Dec(maxTime);
        metrics.avgTimeMs = round4Dec(mean);
        metrics.stdDevTimeMs = round4Dec(stdDev);
        metrics.avgNodesVisited = std::round(totalNodes / runs);
        metrics.avgEdgesExamined = std::round(totalEdges / runs);
        metrics.avgEdgeRelaxations = std::round(totalRelax / runs);
        metrics.pathCost = lastCost;
        metrics.found = lastFound;

        if (metrics.avgTimeMs < fastestTime) {
            fastestTime = metrics.avgTimeMs;
            suite.fastest = alg;
        }

        if (metrics.avgNodesVisited < minVisited) {
            minVisited = metrics.avgNodesVisited;
            suite.fewestVisited = alg;
        }

        if (alg == "dijkstra" && lastCost.has_value()) {
            dijkstraCost = lastCost;
        }
        if (alg == "astar" && lastCost.has_value()) {
            astarCost = lastCost;
        }

        suite.results.push_back(metrics);
    }

    if (dijkstraCost.has_value() && astarCost.has_value()) {
        suite.costMatch = (std::abs(dijkstraCost.value() - astarCost.value()) < 1e-4);
    }

    return suite;
}

nlohmann::json Benchmark::toJson(const BenchmarkSuiteResult& suite) {
    nlohmann::json root;
    root["success"] = true;
    root["graphSummary"] = {
        {"nodes", suite.nodeCount},
        {"edges", suite.edgeCount},
        {"topology", suite.topology},
        {"directed", suite.directed},
        {"weighted", suite.weighted},
        {"seed", suite.seed}
    };
    root["source"] = suite.source;
    root["target"] = suite.target;
    root["runs"] = suite.runs;
    root["costMatch"] = suite.costMatch;
    root["fastest"] = suite.fastest;
    root["fewestVisited"] = suite.fewestVisited;

    nlohmann::json resultsArr = nlohmann::json::array();
    for (const auto& r : suite.results) {
        nlohmann::json item;
        item["algorithm"] = r.algorithm;
        if (!r.heuristic.empty()) {
            item["heuristic"] = r.heuristic;
        }
        item["runs"] = r.runs;
        item["avgTimeMs"] = r.avgTimeMs;
        item["minTimeMs"] = r.minTimeMs;
        item["maxTimeMs"] = r.maxTimeMs;
        item["stdDevTimeMs"] = r.stdDevTimeMs;
        item["avgNodesVisited"] = r.avgNodesVisited;
        item["avgEdgesExamined"] = r.avgEdgesExamined;
        item["avgEdgeRelaxations"] = r.avgEdgeRelaxations;
        if (r.pathCost.has_value()) {
            item["pathCost"] = round4Dec(r.pathCost.value());
        } else {
            item["pathCost"] = nullptr;
        }
        item["found"] = r.found;
        resultsArr.push_back(item);
    }
    root["results"] = resultsArr;

    return root;
}

nlohmann::json Benchmark::processBenchmark(const nlohmann::json& requestJson) {
    int runs = requestJson.value("runs", 5);
    if (runs < 1) runs = 1;

    // Algorithms to run
    std::vector<BenchmarkAlgorithmConfig> algs;
    if (requestJson.contains("algorithms") && requestJson["algorithms"].is_array()) {
        for (const auto& item : requestJson["algorithms"]) {
            if (item.is_string()) {
                algs.push_back({item.get<std::string>(), requestJson.value("heuristic", "euclidean")});
            } else if (item.is_object()) {
                std::string a = item.value("algorithm", "dijkstra");
                std::string h = item.value("heuristic", requestJson.value("heuristic", "euclidean"));
                algs.push_back({a, h});
            }
        }
    }
    if (algs.empty()) {
        algs.push_back({"dijkstra", ""});
        algs.push_back({"astar", "euclidean"});
    }

    std::string topology = "custom";
    uint64_t seed = 42;

    // Build or generate graph
    if (requestJson.contains("graphConfig") && requestJson["graphConfig"].is_object()) {
        const auto& gc = requestJson["graphConfig"];
        GraphGeneratorOptions genOpts;
        genOpts.nodes = gc.value("nodes", 100);
        genOpts.edges = gc.value("edges", 0);
        genOpts.density = gc.value("density", 0.0);
        genOpts.topology = gc.value("topology", "sparse");
        genOpts.directed = gc.value("directed", false);
        genOpts.weighted = gc.value("weighted", true);
        genOpts.seed = (gc.contains("seed") && gc["seed"].is_number()) ? gc["seed"].get<uint64_t>() : 42ULL;

        topology = genOpts.topology;
        seed = genOpts.seed;

        Graph g = GraphGenerator::generate(genOpts);
        std::string source = requestJson.value("source", "");
        std::string target = requestJson.value("target", "");

        if (source.empty() || !g.hasNode(source)) {
            source = g.getNodeId(0);
        }
        if (target.empty() || !g.hasNode(target)) {
            target = g.getNodeId(static_cast<int>(g.getVertexCount() - 1));
        }

        BenchmarkSuiteResult suite = runSuite(g, source, target, algs, runs, topology, seed);
        return toJson(suite);
    } else if (requestJson.contains("graph") && requestJson["graph"].is_object()) {
        // Use uploaded / provided graph
        const auto& graphJson = requestJson["graph"];
        GraphConfig config;
        config.directed = graphJson.value("directed", false);
        config.weighted = graphJson.value("weighted", true);
        Graph g(config);

        if (!graphJson.contains("nodes") || !graphJson["nodes"].is_array() || graphJson["nodes"].empty()) {
            throw std::invalid_argument("Graph must contain at least one node.");
        }

        for (const auto& nodeJson : graphJson["nodes"]) {
            std::string id = nodeJson["id"].get<std::string>();
            std::string label = nodeJson.value("label", id);
            if (nodeJson.contains("x") && nodeJson.contains("y") &&
                nodeJson["x"].is_number() && nodeJson["y"].is_number()) {
                g.addNode(id, label, nodeJson["x"].get<double>(), nodeJson["y"].get<double>());
            } else {
                g.addNode(id, label);
            }
        }

        if (graphJson.contains("edges") && graphJson["edges"].is_array()) {
            for (const auto& edgeJson : graphJson["edges"]) {
                std::string u = edgeJson["source"].get<std::string>();
                std::string v = edgeJson["target"].get<std::string>();
                double w = edgeJson.value("weight", 1.0);
                g.addEdge(u, v, w);
            }
        }

        std::string source = requestJson.value("source", g.getNodeId(0));
        std::string target = requestJson.value("target", g.getNodeId(static_cast<int>(g.getVertexCount() - 1)));

        BenchmarkSuiteResult suite = runSuite(g, source, target, algs, runs, "provided", 0);
        return toJson(suite);
    } else {
        throw std::invalid_argument("Request must contain either 'graphConfig' or 'graph'.");
    }
}
