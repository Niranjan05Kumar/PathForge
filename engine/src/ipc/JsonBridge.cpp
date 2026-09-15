#include "ipc/JsonBridge.h"
#include "graph/Graph.h"
#include "algorithm/BFS.h"
#include "algorithm/DFS.h"
#include "algorithm/Dijkstra.h"
#include "algorithm/AStar.h"
#include "algorithm/Heuristics.h"
#include "benchmark/Benchmark.h"
#include "benchmark/GraphGenerator.h"
#include <nlohmann/json.hpp>
#include <sstream>
#include <algorithm>

using json = nlohmann::json;

namespace {

json makeError(const std::string& code, const std::string& message) {
    return json{
        {"success", false},
        {"error", {
            {"code", code},
            {"message", message}
        }}
    };
}

std::string toLower(std::string str) {
    std::transform(str.begin(), str.end(), str.begin(), ::tolower);
    return str;
}

} // namespace

void JsonBridge::processStream(std::istream& in, std::ostream& out) {
    std::string inputStr((std::istreambuf_iterator<char>(in)),
                          std::istreambuf_iterator<char>());
    out << processString(inputStr);
}

std::string JsonBridge::processString(const std::string& inputJson) {
    if (inputJson.empty()) {
        return makeError("INVALID_JSON", "Request payload is empty.").dump();
    }

    json root;
    try {
        root = json::parse(inputJson);
    } catch (const json::parse_error& e) {
        return makeError("INVALID_JSON", std::string("Malformed JSON: ") + e.what()).dump();
    }

    std::string command = root.value("command", "");
    if (command == "generate_graph" || root.contains("generate")) {
        try {
            const auto& genConfig = root.contains("graphConfig") ? root["graphConfig"] : (root.contains("generate") ? root["generate"] : root);
            GraphGeneratorOptions opts;
            opts.nodes = genConfig.value("nodes", 100);
            opts.edges = genConfig.value("edges", 0);
            opts.density = genConfig.value("density", 0.0);
            opts.topology = genConfig.value("topology", "sparse");
            opts.directed = genConfig.value("directed", false);
            opts.weighted = genConfig.value("weighted", true);
            opts.seed = (genConfig.contains("seed") && genConfig["seed"].is_number()) ? genConfig["seed"].get<uint64_t>() : 42ULL;
            opts.minWeight = genConfig.value("minWeight", 1.0);
            opts.maxWeight = genConfig.value("maxWeight", 10.0);

            Graph g = GraphGenerator::generate(opts);
            return GraphGenerator::toJson(g, opts.topology, opts.seed).dump();
        } catch (const std::exception& e) {
            return makeError("GENERATION_ERROR", e.what()).dump();
        }
    }

    if (command == "benchmark" || root.contains("benchmark") || (root.contains("graphConfig") && root.contains("algorithms"))) {
        try {
            return Benchmark::processBenchmark(root).dump();
        } catch (const std::exception& e) {
            return makeError("BENCHMARK_ERROR", e.what()).dump();
        }
    }

    if (!root.contains("algorithm") || !root["algorithm"].is_string()) {
        return makeError("MISSING_FIELD", "Field 'algorithm' is required.").dump();
    }
    if (!root.contains("source") || !root["source"].is_string()) {
        return makeError("MISSING_FIELD", "Field 'source' is required.").dump();
    }
    if (!root.contains("target") || !root["target"].is_string()) {
        return makeError("MISSING_FIELD", "Field 'target' is required.").dump();
    }
    if (!root.contains("graph") || !root["graph"].is_object()) {
        return makeError("MISSING_FIELD", "Field 'graph' object is required.").dump();
    }

    std::string algorithm = toLower(root["algorithm"].get<std::string>());
    std::string source = root["source"].get<std::string>();
    std::string target = root["target"].get<std::string>();
    std::string mode = root.value("mode", "visualize");
    bool recordTrace = (mode != "benchmark");

    const auto& graphJson = root["graph"];
    GraphConfig config;
    config.directed = graphJson.value("directed", false);
    config.weighted = graphJson.value("weighted", true);

    Graph graph(config);

    if (!graphJson.contains("nodes") || !graphJson["nodes"].is_array() || graphJson["nodes"].empty()) {
        return makeError("EMPTY_GRAPH", "Graph must contain at least one node.").dump();
    }

    // Populate Nodes
    for (const auto& nodeJson : graphJson["nodes"]) {
        if (!nodeJson.contains("id") || !nodeJson["id"].is_string()) {
            return makeError("INVALID_NODE", "Each node must have a valid string 'id'.").dump();
        }
        std::string id = nodeJson["id"].get<std::string>();
        std::string label = nodeJson.value("label", id);

        if (nodeJson.contains("x") && nodeJson.contains("y") &&
            nodeJson["x"].is_number() && nodeJson["y"].is_number()) {
            double x = nodeJson["x"].get<double>();
            double y = nodeJson["y"].get<double>();
            graph.addNode(id, label, x, y);
        } else {
            graph.addNode(id, label);
        }
    }

    // Populate Edges
    if (graphJson.contains("edges") && graphJson["edges"].is_array()) {
        for (const auto& edgeJson : graphJson["edges"]) {
            if (!edgeJson.contains("source") || !edgeJson.contains("target")) {
                return makeError("INVALID_EDGE", "Edge requires 'source' and 'target'.").dump();
            }
            std::string u = edgeJson["source"].get<std::string>();
            std::string v = edgeJson["target"].get<std::string>();
            double weight = edgeJson.value("weight", 1.0);

            if (weight < 0.0) {
                return makeError("NEGATIVE_EDGE_WEIGHT",
                    "Negative edge weight " + std::to_string(weight) + " is not supported.").dump();
            }

            if (!graph.hasNode(u)) {
                return makeError("INVALID_NODE", "Edge source node '" + u + "' does not exist.").dump();
            }
            if (!graph.hasNode(v)) {
                return makeError("INVALID_NODE", "Edge target node '" + v + "' does not exist.").dump();
            }

            graph.addEdge(u, v, weight);
        }
    }

    // Verify source and target exist
    if (!graph.hasNode(source)) {
        return makeError("INVALID_NODE", "Source node '" + source + "' does not exist in graph.").dump();
    }
    if (!graph.hasNode(target)) {
        return makeError("INVALID_NODE", "Target node '" + target + "' does not exist in graph.").dump();
    }

    // Execute selected algorithm
    AlgorithmResult result;
    try {
        if (algorithm == "bfs") {
            result = BFS::run(graph, source, target, AlgorithmOptions(recordTrace));
        } else if (algorithm == "dfs") {
            result = DFS::run(graph, source, target, AlgorithmOptions(recordTrace));
        } else if (algorithm == "dijkstra") {
            result = Dijkstra::run(graph, source, target, AlgorithmOptions(recordTrace));
        } else if (algorithm == "astar") {
            std::string hStr = root.value("heuristic", "euclidean");
            HeuristicType hType = Heuristics::fromString(hStr);
            result = AStar::run(graph, source, target, AStarOptions(recordTrace, hType));
        } else {
            return makeError("INVALID_ALGORITHM", "Unsupported algorithm: '" + algorithm + "'.").dump();
        }
    } catch (const std::invalid_argument& e) {
        std::string msg = e.what();
        if (msg.find("MISSING_NODE_COORDINATES") != std::string::npos) {
            return makeError("MISSING_NODE_COORDINATES", msg).dump();
        }
        if (msg.find("NEGATIVE_EDGE_WEIGHT") != std::string::npos || msg.find("Negative") != std::string::npos) {
            return makeError("NEGATIVE_EDGE_WEIGHT", msg).dump();
        }
        return makeError("INVALID_ARGUMENT", msg).dump();
    } catch (const std::exception& e) {
        return makeError("EXECUTION_ERROR", e.what()).dump();
    }

    // Construct response JSON
    json response;
    response["success"] = true;

    json data;
    data["algorithm"] = algorithm;
    data["source"] = source;
    data["target"] = target;
    data["found"] = result.found;
    data["path"] = result.path;

    if (result.found) {
        data["cost"] = result.cost;
    } else {
        data["cost"] = nullptr;
    }

    data["metrics"] = {
        {"nodesVisited", result.metrics.nodesVisited},
        {"edgesExamined", result.metrics.edgesExamined},
        {"edgeRelaxations", result.metrics.edgeRelaxations},
        {"executionTimeMs", result.metrics.executionTimeMs}
    };

    json stepsJson = json::array();
    if (recordTrace) {
        for (const auto& step : result.steps) {
            stepsJson.push_back({
                {"step", step.step},
                {"action", step.action},
                {"nodeId", step.nodeId},
                {"targetId", step.targetId},
                {"edgeWeight", step.edgeWeight},
                {"frontier", step.frontier},
                {"visited", step.visited},
                {"description", step.description}
            });
        }
    }
    data["steps"] = stepsJson;

    response["data"] = data;
    return response.dump();
}
