#pragma once

#include "TraceEvent.h"
#include <string>
#include <vector>

struct AlgorithmMetrics {
    size_t nodesVisited{0};
    size_t edgesExamined{0};
    size_t edgeRelaxations{0};
    double executionTimeMs{0.0};
};

struct AlgorithmResult {
    bool found{false};
    std::vector<std::string> path;
    double cost{0.0};
    AlgorithmMetrics metrics;
    std::vector<TraceEvent> steps;
};
