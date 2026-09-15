#pragma once

#include "graph/Graph.h"
#include "algorithm/AlgorithmResult.h"
#include "algorithm/AlgorithmOptions.h"
#include <string>

class Dijkstra {
public:
    static AlgorithmResult run(
        const Graph& graph,
        const std::string& sourceId,
        const std::string& targetId,
        const AlgorithmOptions& options = AlgorithmOptions()
    );
};
