#include "algorithm/Heuristics.h"
#include <cmath>
#include <algorithm>
#include <stdexcept>

double Heuristics::evaluate(HeuristicType type, const Node& current, const Node& target) {
    switch (type) {
        case HeuristicType::ZERO:
            return 0.0;
        case HeuristicType::EUCLIDEAN: {
            double dx = current.x - target.x;
            double dy = current.y - target.y;
            return std::sqrt(dx * dx + dy * dy);
        }
        case HeuristicType::MANHATTAN: {
            double dx = std::abs(current.x - target.x);
            double dy = std::abs(current.y - target.y);
            return dx + dy;
        }
    }
    return 0.0;
}

HeuristicType Heuristics::fromString(const std::string& typeStr) {
    std::string lower = typeStr;
    std::transform(lower.begin(), lower.end(), lower.begin(), ::tolower);

    if (lower == "zero") {
        return HeuristicType::ZERO;
    } else if (lower == "euclidean") {
        return HeuristicType::EUCLIDEAN;
    } else if (lower == "manhattan") {
        return HeuristicType::MANHATTAN;
    }

    throw std::invalid_argument("Unknown heuristic type: " + typeStr);
}

std::string Heuristics::toString(HeuristicType type) {
    switch (type) {
        case HeuristicType::ZERO:
            return "zero";
        case HeuristicType::EUCLIDEAN:
            return "euclidean";
        case HeuristicType::MANHATTAN:
            return "manhattan";
    }
    return "unknown";
}
