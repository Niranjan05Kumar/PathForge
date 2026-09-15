#include <iostream>
#include "graph/Graph.h"

int main(int argc, char* argv[]) {
    std::cout << "PathForge Engine v0.1.0 (DSA Core)" << std::endl;
    if (argc > 1) {
        std::cout << "Argument: " << argv[1] << std::endl;
    }

    // Quick demonstration of core graph data structure
    GraphConfig config;
    config.directed = false;
    config.weighted = true;
    Graph g(config);

    g.addNode("A", "Alpha", 0.0, 0.0);
    g.addNode("B", "Beta", 10.0, 5.0);
    g.addNode("C", "Gamma", 20.0, 0.0);
    g.addEdge("A", "B", 4.2);
    g.addEdge("B", "C", 3.8);

    std::cout << "Initialized graph with " << g.getVertexCount() << " vertices and "
              << g.getEdgeCount() << " edges." << std::endl;

    return 0;
}
