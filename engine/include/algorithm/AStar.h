#pragma once

#include "graph/Graph.h"
#include "algorithm/AlgorithmResult.h"
#include "algorithm/AlgorithmOptions.h"
#include "algorithm/Heuristics.h"
#include <string>

struct AStarOptions : public AlgorithmOptions {
    HeuristicType heuristic{HeuristicType::EUCLIDEAN};

    AStarOptions() = default;
    AStarOptions(bool recordTrace, HeuristicType heuristic = HeuristicType::EUCLIDEAN)
        : AlgorithmOptions(recordTrace), heuristic(heuristic) {}
    explicit AStarOptions(HeuristicType heuristic)
        : AlgorithmOptions(true), heuristic(heuristic) {}
};

class AStar {
public:
    static AlgorithmResult run(
        const Graph& graph,
        const std::string& sourceId,
        const std::string& targetId,
        const AStarOptions& options = AStarOptions()
    );
};
