#pragma once

#include "graph/Graph.h"
#include <string>
#include <cstdint>
#include <vector>
#include <nlohmann/json.hpp>

struct GraphGeneratorOptions {
    int nodes{100};
    int edges{0};             // 0 means auto-calculate from density or topology
    double density{0.0};      // 0.0 means use topology default
    std::string topology{"random"}; // "random", "sparse", "dense", "grid", "tree"
    bool directed{false};
    bool weighted{true};
    uint64_t seed{42};
    double minWeight{1.0};
    double maxWeight{10.0};
};

class GraphGenerator {
public:
    static Graph generate(const GraphGeneratorOptions& options);

    static Graph generateRandom(int nodes, int edges, bool directed, bool weighted,
                                uint64_t seed = 42, double minW = 1.0, double maxW = 10.0);

    static Graph generateSparse(int nodes, bool directed, bool weighted,
                                uint64_t seed = 42, int avgDegree = 3, double minW = 1.0, double maxW = 10.0);

    static Graph generateDense(int nodes, double density, bool directed, bool weighted,
                               uint64_t seed = 42, double minW = 1.0, double maxW = 10.0);

    static Graph generateGrid(int rows, int cols, bool directed, bool weighted,
                              uint64_t seed = 42, double minW = 1.0, double maxW = 10.0);

    static Graph generateTree(int nodes, bool directed, bool weighted,
                              uint64_t seed = 42, double minW = 1.0, double maxW = 10.0);

    static nlohmann::json toJson(const Graph& graph, const std::string& topology, uint64_t seed);
};
