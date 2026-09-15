#pragma once

#include "Node.h"
#include "Edge.h"
#include <vector>
#include <unordered_map>
#include <string>
#include <stdexcept>

struct GraphConfig {
    bool directed{false};
    bool weighted{true};
    bool allowDuplicateEdges{false};
    bool allowSelfLoops{false};
};

class Graph {
private:
    GraphConfig config;
    std::vector<Node> nodes;                          // Contiguous indexed array of nodes [0 .. V-1]
    std::unordered_map<std::string, int> nodeToIndex; // Fast string ID to integer index lookup
    std::vector<std::vector<Edge>> adjacencyList;    // Adjacency list indexed by vertex integer ID
    size_t edgeCount{0};

public:
    explicit Graph(GraphConfig config = GraphConfig());

    const GraphConfig& getConfig() const { return config; }
    bool isDirected() const { return config.directed; }
    bool isWeighted() const { return config.weighted; }

    // --- Vertex Operations ---
    int addNode(const std::string& id, const std::string& label = "", double x = 0.0, double y = 0.0);
    bool hasNode(const std::string& id) const;
    int getNodeIndex(const std::string& id) const;
    const std::string& getNodeId(int index) const;
    const Node& getNode(int index) const;
    const Node& getNode(const std::string& id) const;
    void updateNodeCoordinates(const std::string& id, double x, double y);
    bool removeNode(const std::string& id);

    // --- Edge Operations ---
    void addEdge(const std::string& source, const std::string& target, double weight = 1.0);
    bool removeEdge(const std::string& source, const std::string& target);
    bool hasEdge(const std::string& source, const std::string& target) const;
    double getEdgeWeight(const std::string& source, const std::string& target) const;
    void setEdgeWeight(const std::string& source, const std::string& target, double weight);

    // --- Inspection & Query ---
    size_t getVertexCount() const { return nodes.size(); }
    size_t getEdgeCount() const { return edgeCount; }
    const std::vector<Edge>& getNeighbors(int nodeIndex) const;
    const std::vector<Edge>& getNeighbors(const std::string& id) const;
    const std::vector<Node>& getAllNodes() const { return nodes; }
    std::vector<ExternalEdge> getAllEdges() const;

    void clear();
};
