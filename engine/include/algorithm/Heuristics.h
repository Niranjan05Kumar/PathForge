#pragma once

#include "graph/Node.h"
#include <string>

enum class HeuristicType {
    ZERO,
    EUCLIDEAN,
    MANHATTAN
};

class Heuristics {
public:
    static double evaluate(HeuristicType type, const Node& current, const Node& target);
    static HeuristicType fromString(const std::string& typeStr);
    static std::string toString(HeuristicType type);
};
