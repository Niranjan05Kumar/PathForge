#include "algorithm/Dijkstra.h"
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

AlgorithmResult Dijkstra::run(
    const Graph& graph,
    const std::string& sourceId,
    const std::string& targetId,
    const AlgorithmOptions& options
) {
    if (!graph.hasNode(sourceId)) {
        throw std::out_of_range("Source node '" + sourceId + "' does not exist in graph.");
    }
    if (!graph.hasNode(targetId)) {
        throw std::out_of_range("Target node '" + targetId + "' does not exist in graph.");
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
    std::vector<double> dist(V, INF);
    std::vector<int> parent(V, -1);
    std::vector<bool> visited(V, false);
    IndexedMinHeap minHeap(V);
    std::vector<std::string> visitedOrder;

    auto getFrontierIds = [&]() -> std::vector<std::string> {
        std::vector<int> nodeIndices = minHeap.getNodesInHeap();
        std::vector<std::string> ids;
        ids.reserve(nodeIndices.size());
        for (int idx : nodeIndices) {
            ids.push_back(graph.getNodeId(idx));
        }
        return ids;
    };

    int stepCounter = 1;

    dist[startIdx] = 0.0;
    minHeap.push(startIdx, 0.0);

    if (options.recordTrace) {
        result.steps.emplace_back(stepCounter++, "enqueue_node", sourceId, "", 0.0,
            getFrontierIds(), visitedOrder,
            "Inserted start node '" + sourceId + "' with distance 0.00 into priority queue.");
    }

    while (!minHeap.empty()) {
        HeapEntry current = minHeap.pop();
        int u = current.node;

        visited[u] = true;
        result.metrics.nodesVisited++;

        std::string uId = graph.getNodeId(u);
        visitedOrder.push_back(uId);

        if (options.recordTrace) {
            result.steps.emplace_back(stepCounter++, "visit_node", uId, "", 0.0,
                getFrontierIds(), visitedOrder,
                "Extracted node '" + uId + "' with minimum tentative distance " + formatDouble(current.key) + ".");
        }

        if (u == targetIdx) {
            break;
        }

        // Retrieve and sort neighbors deterministically by target ID
        std::vector<Edge> neighbors = graph.getNeighbors(u);
        std::sort(neighbors.begin(), neighbors.end(), [&](const Edge& a, const Edge& b) {
            return graph.getNodeId(a.target) < graph.getNodeId(b.target);
        });

        for (const auto& edge : neighbors) {
            int v = edge.target;
            std::string vId = graph.getNodeId(v);
            result.metrics.edgesExamined++;

            if (edge.weight < 0.0) {
                throw std::invalid_argument("Negative edge weights are not supported in Dijkstra's algorithm: " +
                    std::to_string(edge.weight));
            }

            if (options.recordTrace) {
                result.steps.emplace_back(stepCounter++, "examine_edge", uId, vId, edge.weight,
                    getFrontierIds(), visitedOrder,
                    "Evaluating edge '" + uId + "' -> '" + vId + "' [weight: " + formatDouble(edge.weight) + "].");
            }

            if (visited[v]) {
                continue;
            }

            double newDist = dist[u] + edge.weight;
            if (newDist < dist[v]) {
                double oldDist = dist[v];
                dist[v] = newDist;
                parent[v] = u;
                result.metrics.edgeRelaxations++;

                if (minHeap.contains(v)) {
                    minHeap.decreaseKey(v, newDist);
                } else {
                    minHeap.push(v, newDist);
                }

                if (options.recordTrace) {
                    result.steps.emplace_back(stepCounter++, "relax_edge", uId, vId, edge.weight,
                        getFrontierIds(), visitedOrder,
                        "Relaxed edge '" + uId + "' -> '" + vId + "': updated distance from " +
                        formatDistance(oldDist) + " to " + formatDouble(newDist) + ".");
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
