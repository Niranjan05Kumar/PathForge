#pragma once

#include <string>

// Internal edge structure stored in the adjacency list
struct Edge {
    int target{-1};      // Contiguous 0-indexed integer ID of target vertex
    double weight{1.0};  // Non-negative edge cost

    Edge() = default;
    Edge(int target, double weight = 1.0) : target(target), weight(weight) {}

    bool operator==(const Edge& other) const {
        return target == other.target && weight == other.weight;
    }
};

// External edge structure used for API serialization and queries
struct ExternalEdge {
    std::string source;
    std::string target;
    double weight{1.0};

    ExternalEdge() = default;
    ExternalEdge(std::string source, std::string target, double weight = 1.0)
        : source(std::move(source)), target(std::move(target)), weight(weight) {}
};
