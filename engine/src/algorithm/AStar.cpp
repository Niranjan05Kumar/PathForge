#include "algorithm/AStar.h"
#include "algorithm/IndexedMinHeap.h"
#include "algorithm/PathReconstruction.h"
#include <chrono>
#include <vector>
#include <limits>
#include <algorithm>
#include <sstream>
#include <iomanip>
#include <stdexcept>

namespace {
std::string formatDouble(double val) {
    std::ostringstream ss;
    ss << std::fixed << std::setprecision(2) << val;
    return ss.str();
}

std::string formatDistance(double val) {
    if (val == std::numeric_limits<double>::infinity()) {
        return "INF";
    }
    return formatDouble(val);
}
}

AlgorithmResult AStar::run(
    const Graph& graph,
    const std::string& sourceId,
    const std::string& targetId,
    const AStarOptions& options
) {
    if (!graph.hasNode(sourceId)) {
        throw std::out_of_range("Source node '" + sourceId + "' does not exist in graph.");
    }
    if (!graph.hasNode(targetId)) {
        throw std::out_of_range("Target node '" + targetId + "' does not exist in graph.");
    }

    // Validate coordinates if geometric heuristic requested
    if (options.heuristic != HeuristicType::ZERO) {
        for (const auto& node : graph.getAllNodes()) {
            if (!node.hasCoordinates) {
                throw std::invalid_argument("MISSING_NODE_COORDINATES: Node '" + node.id +
                    "' does not have valid coordinates for geometric heuristic.");
            }
        }
    }

    int startIdx = graph.getNodeIndex(sourceId);
    int targetIdx = graph.getNodeIndex(targetId);

    AlgorithmResult result;
    auto startTime = std::chrono::high_resolution_clock::now();

    // Base case: Source equals Destination
    if (startIdx == targetIdx) {
        auto endTime = std::chrono::high_resolution_clock::now();
        result.found = true;
        result.path = {sourceId};
        result.cost = 0.0;
        result.metrics.nodesVisited = 1;
        result.metrics.edgesExamined = 0;
        result.metrics.edgeRelaxations = 0;
        result.metrics.executionTimeMs = std::chrono::duration<double, std::milli>(endTime - startTime).count();

        if (options.recordTrace) {
            result.steps.emplace_back(1, "visit_node", sourceId, "", 0.0,
                std::vector<std::string>{sourceId}, std::vector<std::string>{sourceId},
                "Source equals destination; cost is 0.00.");
            result.steps.emplace_back(2, "finalize_path", sourceId, "", 0.0,
                std::vector<std::string>{}, std::vector<std::string>{sourceId},
                "Finalized path for single-node route [cost: 0.00].");
        }
        return result;
    }

    size_t V = graph.getVertexCount();
    const double INF = std::numeric_limits<double>::infinity();
    std::vector<double> gScore(V, INF);
    std::vector<double> fScore(V, INF);
    std::vector<int> parent(V, -1);
    std::vector<bool> closed(V, false);
    IndexedMinHeap openSet(V);
    std::vector<std::string> visitedOrder;

    auto getFrontierIds = [&]() -> std::vector<std::string> {
        std::vector<int> nodeIndices = openSet.getNodesInHeap();
        std::vector<std::string> ids;
        ids.reserve(nodeIndices.size());
        for (int idx : nodeIndices) {
            ids.push_back(graph.getNodeId(idx));
        }
        return ids;
    };

    const Node& targetNode = graph.getNode(targetIdx);
    const Node& startNode = graph.getNode(startIdx);

    int stepCounter = 1;

    gScore[startIdx] = 0.0;
    double hStart = Heuristics::evaluate(options.heuristic, startNode, targetNode);
    fScore[startIdx] = hStart;
    openSet.push(startIdx, fScore[startIdx]);

    if (options.recordTrace) {
        result.steps.emplace_back(stepCounter++, "enqueue_node", sourceId, "", 0.0,
            getFrontierIds(), visitedOrder,
            "Inserted start node '" + sourceId + "' [g=0.00, h=" + formatDouble(hStart) +
            ", f=" + formatDouble(fScore[startIdx]) + "] into priority queue.");
    }

    while (!openSet.empty()) {
        HeapEntry current = openSet.pop();
        int u = current.node;

        closed[u] = true;
        result.metrics.nodesVisited++;

        std::string uId = graph.getNodeId(u);
        visitedOrder.push_back(uId);

        const Node& uNode = graph.getNode(u);
        double uH = Heuristics::evaluate(options.heuristic, uNode, targetNode);

        if (options.recordTrace) {
            result.steps.emplace_back(stepCounter++, "visit_node", uId, "", 0.0,
                getFrontierIds(), visitedOrder,
                "Extracted node '" + uId + "' with minimum tentative score [f=" +
                formatDouble(current.key) + ", g=" + formatDouble(gScore[u]) +
                ", h=" + formatDouble(uH) + "].");
        }

        if (u == targetIdx) {
            break;
        }

        // Retrieve and sort neighbors deterministically
        std::vector<Edge> neighbors = graph.getNeighbors(u);
        std::sort(neighbors.begin(), neighbors.end(), [&](const Edge& a, const Edge& b) {
            return graph.getNodeId(a.target) < graph.getNodeId(b.target);
        });

        for (const auto& edge : neighbors) {
            int v = edge.target;
            std::string vId = graph.getNodeId(v);
            result.metrics.edgesExamined++;

            if (edge.weight < 0.0) {
                throw std::invalid_argument("Negative edge weights are not supported in A* search: " +
                    std::to_string(edge.weight));
            }

            if (options.recordTrace) {
                result.steps.emplace_back(stepCounter++, "examine_edge", uId, vId, edge.weight,
                    getFrontierIds(), visitedOrder,
                    "Evaluating edge '" + uId + "' -> '" + vId + "' [weight: " + formatDouble(edge.weight) + "].");
            }

            if (closed[v]) {
                continue;
            }

            double tentativeG = gScore[u] + edge.weight;
            if (tentativeG < gScore[v]) {
                double oldG = gScore[v];
                gScore[v] = tentativeG;
                parent[v] = u;
                result.metrics.edgeRelaxations++;

                const Node& vNode = graph.getNode(v);
                double vH = Heuristics::evaluate(options.heuristic, vNode, targetNode);
                fScore[v] = tentativeG + vH;

                if (openSet.contains(v)) {
                    openSet.decreaseKey(v, fScore[v]);
                } else {
                    openSet.push(v, fScore[v]);
                }

                if (options.recordTrace) {
                    result.steps.emplace_back(stepCounter++, "relax_edge", uId, vId, edge.weight,
                        getFrontierIds(), visitedOrder,
                        "Relaxed edge '" + uId + "' -> '" + vId + "': updated g from " +
                        formatDistance(oldG) + " to " + formatDouble(tentativeG) +
                        " [h=" + formatDouble(vH) + ", f=" + formatDouble(fScore[v]) + "].");
                }
            }
        }
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    result.metrics.executionTimeMs = std::chrono::duration<double, std::milli>(endTime - startTime).count();

    auto recon = PathReconstruction::reconstruct(graph, startIdx, targetIdx, parent);
    result.found = recon.reachable;
    result.path = recon.path;
    result.cost = recon.cost;

    if (options.recordTrace) {
        if (result.found) {
            result.steps.emplace_back(stepCounter++, "finalize_path", targetId, "", 0.0,
                getFrontierIds(), visitedOrder,
                "Goal reached! Reconstructed optimal route [" + std::to_string(result.path.size()) +
                " nodes, cost: " + formatDouble(result.cost) + "].");
        } else {
            result.steps.emplace_back(stepCounter++, "no_path", targetId, "", 0.0,
                getFrontierIds(), visitedOrder,
                "Priority queue exhausted without reaching '" + targetId + "'. No route exists.");
        }
    }

    return result;
}
