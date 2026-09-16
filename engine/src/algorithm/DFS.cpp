#include "algorithm/DFS.h"
#include "algorithm/PathReconstruction.h"
#include <chrono>
#include <vector>
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

struct StackFrame {
    int node{-1};
    int parent{-1};
    double edgeWeight{0.0};

    StackFrame() = default;
    StackFrame(int node, int parent, double edgeWeight = 0.0)
        : node(node), parent(parent), edgeWeight(edgeWeight) {}
};
}

AlgorithmResult DFS::run(
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
    std::vector<StackFrame> stack;
    std::vector<std::string> visitedOrder;

    auto getFrontierIds = [&]() -> std::vector<std::string> {
        std::vector<std::string> ids;
        ids.reserve(stack.size());
        for (const auto& frame : stack) {
            ids.push_back(graph.getNodeId(frame.node));
        }
        return ids;
    };

    int stepCounter = 1;

    // Push start node to stack
    stack.emplace_back(startIdx, -1, 0.0);

    if (options.recordTrace) {
        result.steps.emplace_back(stepCounter++, "push_node", sourceId, "", 0.0,
            getFrontierIds(), visitedOrder,
            "Pushed start node '" + sourceId + "' onto execution stack.");
    }

    while (!stack.empty()) {
        StackFrame current = stack.back();
        stack.pop_back();

        int u = current.node;
        int p = current.parent;

        // Skip if already visited via another path
        if (visited[u]) {
            continue;
        }

        visited[u] = true;
        parent[u] = p;
        result.metrics.nodesVisited++;

        std::string uId;
        if (options.recordTrace) {
            uId = graph.getNodeId(u);
            visitedOrder.push_back(uId);
            result.steps.emplace_back(stepCounter++, "visit_node", uId, "", 0.0,
                getFrontierIds(), visitedOrder,
                "Popped and visited node '" + uId + "'; expanding outgoing edges.");
        }

        if (u == targetIdx) {
            break;
        }

        // Neighbors are maintained in deterministic sorted order by target node ID
        const auto& neighbors = graph.getNeighbors(u);

        // Push in reverse order so lowest alphabetical target pops first (LIFO order)
        for (auto it = neighbors.rbegin(); it != neighbors.rend(); ++it) {
            int v = it->target;
            result.metrics.edgesExamined++;

            if (options.recordTrace) {
                std::string vId = graph.getNodeId(v);
                result.steps.emplace_back(stepCounter++, "examine_edge", uId, vId, it->weight,
                    getFrontierIds(), visitedOrder,
                    "Examining edge '" + uId + "' -> '" + vId + "' [weight: " + formatDouble(it->weight) + "].");
            }

            if (!visited[v]) {
                stack.emplace_back(v, u, it->weight);

                if (options.recordTrace) {
                    std::string vId = graph.getNodeId(v);
                    result.steps.emplace_back(stepCounter++, "push_node", vId, "", it->weight,
                        getFrontierIds(), visitedOrder,
                        "Pushed neighbor '" + vId + "' onto stack with predecessor '" + uId + "'.");
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
                "Goal reached! Reconstructed DFS route [" + std::to_string(result.path.size()) +
                " nodes, cost: " + formatDouble(result.cost) + "].");
        } else {
            result.steps.emplace_back(stepCounter++, "no_path", targetId, "", 0.0,
                getFrontierIds(), visitedOrder,
                "Stack exhausted without reaching '" + targetId + "'. No route exists.");
        }
    }

    return result;
}
