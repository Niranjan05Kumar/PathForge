#include <iostream>
#include "graph/Graph.h"
#include "algorithm/BFS.h"
#include "algorithm/DFS.h"

int main(int argc, char* argv[]) {
    std::cout << "PathForge Engine v0.1.0 (DSA Core)" << std::endl;
    if (argc > 1) {
        std::cout << "Argument: " << argv[1] << std::endl;
    }

    // Graph demonstration
    GraphConfig config;
    config.directed = false;
    config.weighted = true;
    Graph g(config);

    g.addNode("A", "Alpha", 0.0, 0.0);
    g.addNode("B", "Beta", 10.0, 5.0);
    g.addNode("C", "Gamma", 20.0, 0.0);
    g.addEdge("A", "B", 4.2);
    g.addEdge("B", "C", 3.8);

    std::cout << "Initialized graph: " << g.getVertexCount() << " vertices, "
              << g.getEdgeCount() << " edges." << std::endl;

    // BFS execution
    AlgorithmResult bfsRes = BFS::run(g, "A", "C");
    std::cout << "BFS (A -> C): Found=" << std::boolalpha << bfsRes.found
              << ", Cost=" << bfsRes.cost
              << ", Visited=" << bfsRes.metrics.nodesVisited
              << ", Time=" << bfsRes.metrics.executionTimeMs << "ms" << std::endl;

    // DFS execution
    AlgorithmResult dfsRes = DFS::run(g, "A", "C");
    std::cout << "DFS (A -> C): Found=" << std::boolalpha << dfsRes.found
              << ", Cost=" << dfsRes.cost
              << ", Visited=" << dfsRes.metrics.nodesVisited
              << ", Time=" << dfsRes.metrics.executionTimeMs << "ms" << std::endl;

    return 0;
}
