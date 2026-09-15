#pragma once

#include "graph/Graph.h"
#include <vector>
#include <string>

struct ReconstructedPath {
    bool reachable{false};
    std::vector<std::string> path;
    double cost{0.0};
};

class PathReconstruction {
public:
    static ReconstructedPath reconstruct(
        const Graph& graph,
        int sourceIdx,
        int targetIdx,
        const std::vector<int>& parent
    );
};
