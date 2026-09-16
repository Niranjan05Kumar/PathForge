#include "ipc/JsonBridge.h"
#include "graph/Graph.h"
#include "algorithm/BFS.h"
#include "algorithm/DFS.h"
#include "algorithm/Dijkstra.h"
#include "algorithm/AStar.h"
#include "algorithm/Heuristics.h"
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
    try {
        std::string inputStr((std::istreambuf_iterator<char>(in)),
                              std::istreambuf_iterator<char>());
        out << processString(inputStr) << std::endl;
    } catch (const std::exception& e) {
        out << makeError("STREAM_READ_ERROR", e.what()).dump() << std::endl;
    } catch (...) {
        out << makeError("FATAL_ERROR", "Unknown exception caught during stream processing.").dump() << std::endl;
    }
}

std::string JsonBridge::processString(const std::string& inputJson) {
    if (inputJson.empty()) {
        return makeError("INVALID_JSON", "Request payload is empty.").dump();
    }

    try {
        json root;
        try {
            root = json::parse(inputJson);
        } catch (const json::parse_error& e) {
            return makeError("INVALID_JSON", std::string("Malformed JSON: ") + e.what()).dump();
        }

        if (!root.is_object()) {
            return makeError("INVALID_PAYLOAD", "Request body must be a valid JSON object.").dump();
        }

        if (!root.contains("algorithm") || !root["algorithm"].is_string()) {
            return makeError("MISSING_FIELD", "Field 'algorithm' is required and must be a string.").dump();
        }
        if (!root.contains("source") || !root["source"].is_string()) {
            return makeError("MISSING_FIELD", "Field 'source' is required and must be a string.").dump();
        }
        if (!root.contains("target") || !root["target"].is_string()) {
            return makeError("MISSING_FIELD", "Field 'target' is required and must be a string.").dump();
        }
        if (!root.contains("graph") || !root["graph"].is_object()) {
            return makeError("MISSING_FIELD", "Field 'graph' object is required.").dump();
        }

        std::string algorithm = toLower(root["algorithm"].get<std::string>());
        std::string source = root["source"].get<std::string>();
        std::string target = root["target"].get<std::string>();

        if (source.empty()) {
            return makeError("INVALID_NODE", "Source node ID cannot be empty.").dump();
        }
        if (target.empty()) {
            return makeError("INVALID_NODE", "Target node ID cannot be empty.").dump();
        }

        // Trace recording control: defaults to true for stepped visualization playback
        bool recordTrace = true;
        if (root.contains("recordTrace") && root["recordTrace"].is_boolean()) {
            recordTrace = root["recordTrace"].get<bool>();
        }

        const auto& graphJson = root["graph"];
        GraphConfig config;
        config.directed = graphJson.value("directed", false);
        config.weighted = graphJson.value("weighted", true);
        config.allowDuplicateEdges = graphJson.value("allowDuplicateEdges", false);
        config.allowSelfLoops = graphJson.value("allowSelfLoops", false);

        Graph graph(config);

        if (!graphJson.contains("nodes") || !graphJson["nodes"].is_array() || graphJson["nodes"].empty()) {
            return makeError("EMPTY_GRAPH", "Graph must contain at least one node.").dump();
        }

        // Populate Nodes
        for (const auto& nodeJson : graphJson["nodes"]) {
            if (!nodeJson.is_object()) {
                return makeError("INVALID_NODE", "Each node in 'nodes' must be an object.").dump();
            }
            if (!nodeJson.contains("id") || !nodeJson["id"].is_string()) {
                return makeError("INVALID_NODE", "Each node must have a valid string 'id'.").dump();
            }
            std::string id = nodeJson["id"].get<std::string>();
            if (id.empty()) {
                return makeError("INVALID_NODE", "Node ID cannot be empty.").dump();
            }
            if (graph.hasNode(id)) {
                return makeError("DUPLICATE_NODE", "Duplicate node ID detected: '" + id + "'.").dump();
            }

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
        if (graphJson.contains("edges")) {
            if (!graphJson["edges"].is_array()) {
                return makeError("INVALID_GRAPH", "Field 'edges' must be an array.").dump();
            }
            for (const auto& edgeJson : graphJson["edges"]) {
                if (!edgeJson.is_object()) {
                    return makeError("INVALID_EDGE", "Each edge must be an object.").dump();
                }
                if (!edgeJson.contains("source") || !edgeJson["source"].is_string() ||
                    !edgeJson.contains("target") || !edgeJson["target"].is_string()) {
                    return makeError("INVALID_EDGE", "Edge requires string 'source' and 'target'.").dump();
                }
                std::string u = edgeJson["source"].get<std::string>();
                std::string v = edgeJson["target"].get<std::string>();

                if (!graph.hasNode(u)) {
                    return makeError("INVALID_NODE", "Edge source node '" + u + "' does not exist.").dump();
                }
                if (!graph.hasNode(v)) {
                    return makeError("INVALID_NODE", "Edge target node '" + v + "' does not exist.").dump();
                }

                if (!config.allowSelfLoops && u == v) {
                    return makeError("SELF_LOOP_DISALLOWED", "Self-loops are not allowed: '" + u + "' -> '" + v + "'.").dump();
                }

                if (!config.allowDuplicateEdges && graph.hasEdge(u, v)) {
                    return makeError("DUPLICATE_EDGE", "Duplicate edge detected between '" + u + "' and '" + v + "'.").dump();
                }

                double weight = 1.0;
                if (edgeJson.contains("weight")) {
                    if (!edgeJson["weight"].is_number()) {
                        return makeError("INVALID_EDGE_WEIGHT", "Edge weight must be a valid number.").dump();
                    }
                    weight = edgeJson["weight"].get<double>();
                }

                if (config.weighted && weight < 0.0) {
                    return makeError("NEGATIVE_EDGE_WEIGHT",
                        "Negative edge weight " + std::to_string(weight) + " is not supported.").dump();
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

    } catch (const nlohmann::json::exception& e) {
        return makeError("MALFORMED_JSON_PAYLOAD", std::string("JSON processing error: ") + e.what()).dump();
    } catch (const std::invalid_argument& e) {
        std::string msg = e.what();
        if (msg.find("already exists") != std::string::npos || msg.find("Duplicate node") != std::string::npos) {
            return makeError("DUPLICATE_NODE", msg).dump();
        }
        if (msg.find("Duplicate edge") != std::string::npos) {
            return makeError("DUPLICATE_EDGE", msg).dump();
        }
        if (msg.find("Self-loops") != std::string::npos || msg.find("Self-loop") != std::string::npos) {
            return makeError("SELF_LOOP_DISALLOWED", msg).dump();
        }
        if (msg.find("Negative") != std::string::npos || msg.find("NEGATIVE_EDGE_WEIGHT") != std::string::npos) {
            return makeError("NEGATIVE_EDGE_WEIGHT", msg).dump();
        }
        if (msg.find("MISSING_NODE_COORDINATES") != std::string::npos) {
            return makeError("MISSING_NODE_COORDINATES", msg).dump();
        }
        return makeError("INVALID_ARGUMENT", msg).dump();
    } catch (const std::out_of_range& e) {
        return makeError("INVALID_NODE", e.what()).dump();
    } catch (const std::exception& e) {
        return makeError("INTERNAL_ERROR", e.what()).dump();
    } catch (...) {
        return makeError("UNKNOWN_ERROR", "An unexpected unknown error occurred.").dump();
    }
}
