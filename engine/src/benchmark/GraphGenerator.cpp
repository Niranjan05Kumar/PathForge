#include "benchmark/GraphGenerator.h"
#include <random>
#include <cmath>
#include <stdexcept>
#include <algorithm>
#include <unordered_set>
#include <iomanip>

namespace {
double round1Dec(double val) {
    return std::round(val * 10.0) / 10.0;
}
} // namespace

Graph GraphGenerator::generate(const GraphGeneratorOptions& options) {
    if (options.nodes <= 0) {
        throw std::invalid_argument("Node count must be greater than 0.");
    }

    std::string topo = options.topology;
    std::transform(topo.begin(), topo.end(), topo.begin(), ::tolower);

    if (topo == "grid") {
        int r = static_cast<int>(std::sqrt(options.nodes));
        if (r < 1) r = 1;
        int c = (options.nodes + r - 1) / r;
        return generateGrid(r, c, options.directed, options.weighted,
                            options.seed, options.minWeight, options.maxWeight);
    } else if (topo == "tree") {
        return generateTree(options.nodes, options.directed, options.weighted,
                            options.seed, options.minWeight, options.maxWeight);
    } else if (topo == "dense") {
        double d = options.density > 0.0 ? options.density : 0.25;
        return generateDense(options.nodes, d, options.directed, options.weighted,
                             options.seed, options.minWeight, options.maxWeight);
    } else if (topo == "sparse") {
        int avgDeg = options.edges > 0 ? (options.edges / options.nodes) : 3;
        if (avgDeg < 1) avgDeg = 1;
        return generateSparse(options.nodes, options.directed, options.weighted,
                              options.seed, avgDeg, options.minWeight, options.maxWeight);
    } else {
        // Default: random
        int targetEdges = options.edges > 0 ? options.edges : (options.nodes * 3);
        return generateRandom(options.nodes, targetEdges, options.directed, options.weighted,
                              options.seed, options.minWeight, options.maxWeight);
    }
}

Graph GraphGenerator::generateRandom(int nodes, int edges, bool directed, bool weighted,
                                    uint64_t seed, double minW, double maxW) {
    if (nodes <= 0) {
        throw std::invalid_argument("Node count must be greater than 0.");
    }

    GraphConfig config;
    config.directed = directed;
    config.weighted = weighted;
    Graph graph(config);

    std::mt19937_64 rng(seed);
    std::uniform_real_distribution<double> coordDist(50.0, 950.0);
    std::uniform_real_distribution<double> weightDist(minW, maxW);

    // 1. Add all nodes with pseudo-random coordinates
    for (int i = 0; i < nodes; ++i) {
        std::string id = "node_" + std::to_string(i);
        double x = round1Dec(coordDist(rng));
        double y = round1Dec(coordDist(rng));
        graph.addNode(id, id, x, y);
    }

    if (nodes == 1) return graph;

    // 2. Build initial random backbone chain to ensure connectivity
    int addedEdges = 0;
    for (int i = 0; i < nodes - 1; ++i) {
        std::string u = "node_" + std::to_string(i);
        std::string v = "node_" + std::to_string(i + 1);
        const auto& nu = graph.getNode(u);
        const auto& nv = graph.getNode(v);
        double dist = std::hypot(nu.x - nv.x, nu.y - nv.y);
        double w = weighted ? round1Dec(dist + weightDist(rng)) : 1.0;
        graph.addEdge(u, v, w);
        addedEdges++;
    }

    // 3. Add remaining edges up to target
    std::uniform_int_distribution<int> nodeDist(0, nodes - 1);
    int attempts = 0;
    int maxAttempts = edges * 10 + 1000;

    while (addedEdges < edges && attempts < maxAttempts) {
        attempts++;
        int uIdx = nodeDist(rng);
        int vIdx = nodeDist(rng);
        if (uIdx == vIdx) continue;

        std::string u = "node_" + std::to_string(uIdx);
        std::string v = "node_" + std::to_string(vIdx);

        if (graph.hasEdge(u, v)) continue;

        const auto& nu = graph.getNode(u);
        const auto& nv = graph.getNode(v);
        double dist = std::hypot(nu.x - nv.x, nu.y - nv.y);
        double w = weighted ? round1Dec(dist + weightDist(rng)) : 1.0;
        graph.addEdge(u, v, w);
        addedEdges++;
    }

    return graph;
}

Graph GraphGenerator::generateSparse(int nodes, bool directed, bool weighted,
                                    uint64_t seed, int avgDegree, double minW, double maxW) {
    int targetEdges = nodes * avgDegree;
    return generateRandom(nodes, targetEdges, directed, weighted, seed, minW, maxW);
}

Graph GraphGenerator::generateDense(int nodes, double density, bool directed, bool weighted,
                                   uint64_t seed, double minW, double maxW) {
    if (nodes <= 0) {
        throw std::invalid_argument("Node count must be greater than 0.");
    }
    density = std::max(0.01, std::min(1.0, density));

    GraphConfig config;
    config.directed = directed;
    config.weighted = weighted;
    Graph graph(config);

    std::mt19937_64 rng(seed);
    std::uniform_real_distribution<double> coordDist(50.0, 950.0);
    std::uniform_real_distribution<double> weightDist(minW, maxW);
    std::uniform_real_distribution<double> probDist(0.0, 1.0);

    for (int i = 0; i < nodes; ++i) {
        std::string id = "node_" + std::to_string(i);
        graph.addNode(id, id, round1Dec(coordDist(rng)), round1Dec(coordDist(rng)));
    }

    if (nodes <= 1) return graph;

    // Connect backbone first
    for (int i = 0; i < nodes - 1; ++i) {
        std::string u = "node_" + std::to_string(i);
        std::string v = "node_" + std::to_string(i + 1);
        const auto& nu = graph.getNode(u);
        const auto& nv = graph.getNode(v);
        double dist = std::hypot(nu.x - nv.x, nu.y - nv.y);
        double w = weighted ? round1Dec(dist + weightDist(rng)) : 1.0;
        graph.addEdge(u, v, w);
    }

    // Connect pairs based on density
    for (int i = 0; i < nodes; ++i) {
        for (int j = (directed ? 0 : i + 1); j < nodes; ++j) {
            if (i == j) continue;
            std::string u = "node_" + std::to_string(i);
            std::string v = "node_" + std::to_string(j);
            if (graph.hasEdge(u, v)) continue;

            if (probDist(rng) <= density) {
                const auto& nu = graph.getNode(u);
                const auto& nv = graph.getNode(v);
                double dist = std::hypot(nu.x - nv.x, nu.y - nv.y);
                double w = weighted ? round1Dec(dist + weightDist(rng)) : 1.0;
                graph.addEdge(u, v, w);
            }
        }
    }

    return graph;
}

Graph GraphGenerator::generateGrid(int rows, int cols, bool directed, bool weighted,
                                  uint64_t seed, double minW, double maxW) {
    if (rows <= 0 || cols <= 0) {
        throw std::invalid_argument("Grid rows and cols must be greater than 0.");
    }

    GraphConfig config;
    config.directed = directed;
    config.weighted = weighted;
    Graph graph(config);

    std::mt19937_64 rng(seed);
    std::uniform_real_distribution<double> weightDist(minW, maxW);

    int maxDim = std::max(rows > 1 ? rows - 1 : 1, cols > 1 ? cols - 1 : 1);
    double step = round1Dec(900.0 / maxDim);
    if (step < 1.0) step = 1.0;

    for (int r = 0; r < rows; ++r) {
        for (int c = 0; c < cols; ++c) {
            std::string id = "grid_" + std::to_string(r) + "_" + std::to_string(c);
            double x = round1Dec(50.0 + c * step);
            double y = round1Dec(50.0 + r * step);
            graph.addNode(id, std::to_string(r) + "," + std::to_string(c), x, y);
        }
    }

    for (int r = 0; r < rows; ++r) {
        for (int c = 0; c < cols; ++c) {
            std::string u = "grid_" + std::to_string(r) + "_" + std::to_string(c);

            // Horizontal neighbor (to the right)
            if (c + 1 < cols) {
                std::string v = "grid_" + std::to_string(r) + "_" + std::to_string(c + 1);
                double w = weighted ? round1Dec(step + weightDist(rng)) : 1.0;
                graph.addEdge(u, v, w);
            }

            // Vertical neighbor (downwards)
            if (r + 1 < rows) {
                std::string v = "grid_" + std::to_string(r + 1) + "_" + std::to_string(c);
                double w = weighted ? round1Dec(step + weightDist(rng)) : 1.0;
                graph.addEdge(u, v, w);
            }
        }
    }

    return graph;
}

Graph GraphGenerator::generateTree(int nodes, bool directed, bool weighted,
                                  uint64_t seed, double minW, double maxW) {
    if (nodes <= 0) {
        throw std::invalid_argument("Node count must be greater than 0.");
    }

    GraphConfig config;
    config.directed = directed;
    config.weighted = weighted;
    Graph graph(config);

    std::mt19937_64 rng(seed);
    std::uniform_real_distribution<double> coordDist(50.0, 950.0);
    std::uniform_real_distribution<double> weightDist(minW, maxW);

    for (int i = 0; i < nodes; ++i) {
        std::string id = "node_" + std::to_string(i);
        graph.addNode(id, id, round1Dec(coordDist(rng)), round1Dec(coordDist(rng)));
    }

    // Connect node i to a random earlier node 0 <= p < i
    for (int i = 1; i < nodes; ++i) {
        std::uniform_int_distribution<int> parentDist(0, i - 1);
        int p = parentDist(rng);
        std::string u = "node_" + std::to_string(p);
        std::string v = "node_" + std::to_string(i);
        const auto& nu = graph.getNode(u);
        const auto& nv = graph.getNode(v);
        double dist = std::hypot(nu.x - nv.x, nu.y - nv.y);
        double w = weighted ? round1Dec(dist + weightDist(rng)) : 1.0;
        graph.addEdge(u, v, w);
    }

    return graph;
}

nlohmann::json GraphGenerator::toJson(const Graph& graph, const std::string& topology, uint64_t seed) {
    nlohmann::json root;
    root["success"] = true;
    root["topology"] = topology;
    root["seed"] = seed;
    root["directed"] = graph.isDirected();
    root["weighted"] = graph.isWeighted();
    root["nodeCount"] = graph.getVertexCount();
    root["edgeCount"] = graph.getEdgeCount();

    nlohmann::json nodesArray = nlohmann::json::array();
    for (size_t i = 0; i < graph.getVertexCount(); ++i) {
        std::string id = graph.getNodeId(static_cast<int>(i));
        const auto& node = graph.getNode(id);
        nlohmann::json n;
        n["id"] = node.id;
        n["label"] = node.label;
        if (node.hasCoordinates) {
            n["x"] = node.x;
            n["y"] = node.y;
        }
        nodesArray.push_back(n);
    }
    root["nodes"] = nodesArray;

    nlohmann::json edgesArray = nlohmann::json::array();
    for (size_t u = 0; u < graph.getVertexCount(); ++u) {
        for (const auto& edge : graph.getNeighbors(static_cast<int>(u))) {
            // For undirected graphs, emit each edge once where u <= target
            if (!graph.isDirected() && static_cast<int>(u) > edge.target) {
                continue;
            }
            nlohmann::json e;
            e["source"] = graph.getNodeId(static_cast<int>(u));
            e["target"] = graph.getNodeId(edge.target);
            e["weight"] = edge.weight;
            edgesArray.push_back(e);
        }
    }
    root["edges"] = edgesArray;

    return root;
}
