#include "algorithm/PathReconstruction.h"
#include <algorithm>

ReconstructedPath PathReconstruction::reconstruct(
    const Graph& graph,
    int sourceIdx,
    int targetIdx,
    const std::vector<int>& parent
) {
    ReconstructedPath result;

    if (sourceIdx == targetIdx) {
        result.reachable = true;
        result.path = {graph.getNodeId(sourceIdx)};
        result.cost = 0.0;
        return result;
    }

    if (targetIdx < 0 || static_cast<size_t>(targetIdx) >= parent.size() || parent[targetIdx] == -1) {
        result.reachable = false;
        result.path = {};
        result.cost = 0.0;
        return result;
    }

    std::vector<int> pathIndices;
    int curr = targetIdx;
    while (curr != -1) {
        pathIndices.push_back(curr);
        if (curr == sourceIdx) {
            break;
        }
        curr = parent[curr];
    }

    if (pathIndices.back() != sourceIdx) {
        result.reachable = false;
        result.path = {};
        result.cost = 0.0;
        return result;
    }

    std::reverse(pathIndices.begin(), pathIndices.end());

    result.reachable = true;
    result.path.reserve(pathIndices.size());
    for (int idx : pathIndices) {
        result.path.push_back(graph.getNodeId(idx));
    }

    double totalCost = 0.0;
    for (size_t i = 0; i + 1 < pathIndices.size(); ++i) {
        int u = pathIndices[i];
        int v = pathIndices[i + 1];
        if (graph.isWeighted()) {
            totalCost += graph.getEdgeWeight(graph.getNodeId(u), graph.getNodeId(v));
        } else {
            totalCost += 1.0;
        }
    }
    result.cost = totalCost;

    return result;
}
