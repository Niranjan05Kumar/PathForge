#include "algorithm/BFS.h"
#include "algorithm/PathReconstruction.h"
#include <chrono>
#include <deque>
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
}

AlgorithmResult BFS::run(
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
                "Source equals destination; goal immediately reached.");
            result.steps.emplace_back(2, "finalize_path", sourceId, "", 0.0,
                std::vector<std::string>{}, std::vector<std::string>{sourceId},
                "Finalized path for single-node route [cost: 0.00].");
        }
        return result;
    }

    size_t V = graph.getVertexCount();
    std::vector<bool> visited(V, false);
    std::vector<int> parent(V, -1);
    std::deque<int> frontierQueue;
    std::vector<std::string> visitedOrder;

    auto getFrontierIds = [&]() -> std::vector<std::string> {
        std::vector<std::string> ids;
        ids.reserve(frontierQueue.size());
        for (int idx : frontierQueue) {
            ids.push_back(graph.getNodeId(idx));
        }
        return ids;
    };

    int stepCounter = 1;

    visited[startIdx] = true;
    frontierQueue.push_back(startIdx);

    if (options.recordTrace) {
        result.steps.emplace_back(stepCounter++, "enqueue_node", sourceId, "", 0.0,
            getFrontierIds(), visitedOrder,
            "Enqueued start node '" + sourceId + "' to BFS frontier.");
    }

    while (!frontierQueue.empty()) {
        int u = frontierQueue.front();
        frontierQueue.pop_front();

        result.metrics.nodesVisited++;
        std::string uId = graph.getNodeId(u);
        visitedOrder.push_back(uId);

        if (options.recordTrace) {
            result.steps.emplace_back(stepCounter++, "visit_node", uId, "", 0.0,
                getFrontierIds(), visitedOrder,
                "Visited node '" + uId + "'; inspecting outgoing neighbors.");
        }

        if (u == targetIdx) {
            break;
        }

        // Sort neighbors deterministically by target node ID
        std::vector<Edge> neighbors = graph.getNeighbors(u);
        std::sort(neighbors.begin(), neighbors.end(), [&](const Edge& a, const Edge& b) {
            return graph.getNodeId(a.target) < graph.getNodeId(b.target);
        });

        for (const auto& edge : neighbors) {
            int v = edge.target;
            std::string vId = graph.getNodeId(v);
            result.metrics.edgesExamined++;

            if (options.recordTrace) {
                result.steps.emplace_back(stepCounter++, "examine_edge", uId, vId, edge.weight,
                    getFrontierIds(), visitedOrder,
                    "Examining edge '" + uId + "' -> '" + vId + "' [weight: " + formatDouble(edge.weight) + "].");
            }

            if (!visited[v]) {
                visited[v] = true;
                parent[v] = u;
                frontierQueue.push_back(v);

                if (options.recordTrace) {
                    result.steps.emplace_back(stepCounter++, "enqueue_node", vId, "", edge.weight,
                        getFrontierIds(), visitedOrder,
                        "Enqueued node '" + vId + "' with predecessor '" + uId + "'.");
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
                "Goal reached! Reconstructed shortest unweighted route [" + std::to_string(result.path.size()) +
                " nodes, cost: " + formatDouble(result.cost) + "].");
        } else {
            result.steps.emplace_back(stepCounter++, "no_path", targetId, "", 0.0,
                getFrontierIds(), visitedOrder,
                "Frontier exhausted without reaching '" + targetId + "'. No route exists.");
        }
    }

    return result;
}
