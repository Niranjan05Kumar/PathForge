#include "graph/Graph.h"
#include <algorithm>
#include <stdexcept>

Graph::Graph(GraphConfig config) : config(config) {}

int Graph::addNode(const std::string& id, const std::string& label) {
    if (id.empty()) {
        throw std::invalid_argument("Node ID cannot be empty.");
    }
    if (hasNode(id)) {
        throw std::invalid_argument("Node '" + id + "' already exists in graph.");
    }

    int newIndex = static_cast<int>(nodes.size());
    nodes.emplace_back(id, label);
    nodeToIndex[id] = newIndex;
    adjacencyList.emplace_back();
    return newIndex;
}

int Graph::addNode(const std::string& id, const std::string& label, double x, double y) {
    if (id.empty()) {
        throw std::invalid_argument("Node ID cannot be empty.");
    }
    if (hasNode(id)) {
        throw std::invalid_argument("Node '" + id + "' already exists in graph.");
    }

    int newIndex = static_cast<int>(nodes.size());
    nodes.emplace_back(id, label, x, y);
    nodeToIndex[id] = newIndex;
    adjacencyList.emplace_back();
    return newIndex;
}

bool Graph::hasNode(const std::string& id) const {
    return nodeToIndex.find(id) != nodeToIndex.end();
}

int Graph::getNodeIndex(const std::string& id) const {
    auto it = nodeToIndex.find(id);
    if (it == nodeToIndex.end()) {
        throw std::out_of_range("Node '" + id + "' does not exist in graph.");
    }
    return it->second;
}

const std::string& Graph::getNodeId(int index) const {
    if (index < 0 || static_cast<size_t>(index) >= nodes.size()) {
        throw std::out_of_range("Node index " + std::to_string(index) + " out of range.");
    }
    return nodes[index].id;
}

const Node& Graph::getNode(int index) const {
    if (index < 0 || static_cast<size_t>(index) >= nodes.size()) {
        throw std::out_of_range("Node index " + std::to_string(index) + " out of range.");
    }
    return nodes[index];
}

const Node& Graph::getNode(const std::string& id) const {
    return getNode(getNodeIndex(id));
}

void Graph::updateNodeCoordinates(const std::string& id, double x, double y) {
    int idx = getNodeIndex(id);
    nodes[idx].x = x;
    nodes[idx].y = y;
    nodes[idx].hasCoordinates = true;
}

bool Graph::removeNode(const std::string& id) {
    auto it = nodeToIndex.find(id);
    if (it == nodeToIndex.end()) {
        return false;
    }

    int targetIdx = it->second;
    int lastIdx = static_cast<int>(nodes.size()) - 1;

    // Step 1: Remove all edges incident to targetIdx
    if (config.directed) {
        // Decrement edgeCount by outgoing edges from targetIdx
        edgeCount -= adjacencyList[targetIdx].size();
        adjacencyList[targetIdx].clear();

        // Scan all other vertices to remove incoming edges targeting targetIdx
        for (size_t u = 0; u < nodes.size(); ++u) {
            if (static_cast<int>(u) == targetIdx) continue;
            auto& edges = adjacencyList[u];
            size_t beforeSize = edges.size();
            edges.erase(
                std::remove_if(edges.begin(), edges.end(),
                    [targetIdx](const Edge& e) { return e.target == targetIdx; }),
                edges.end()
            );
            edgeCount -= (beforeSize - edges.size());
        }
    } else {
        // Undirected: every neighbor of targetIdx has targetIdx in its adjacency list
        for (const auto& edge : adjacencyList[targetIdx]) {
            if (edge.target != targetIdx) {
                auto& neighborEdges = adjacencyList[edge.target];
                auto removeIt = std::find_if(neighborEdges.begin(), neighborEdges.end(),
                    [targetIdx](const Edge& e) { return e.target == targetIdx; });
                if (removeIt != neighborEdges.end()) {
                    neighborEdges.erase(removeIt);
                }
            }
            // Each incident undirected edge (including self-loops) decrements count once
            edgeCount--;
        }
        adjacencyList[targetIdx].clear();
    }

    // Step 2: Relocate the last node to targetIdx to keep contiguous indexing [0 .. V-1]
    if (targetIdx != lastIdx) {
        // Move node data and adjacency list from lastIdx into targetIdx
        nodes[targetIdx] = std::move(nodes[lastIdx]);
        adjacencyList[targetIdx] = std::move(adjacencyList[lastIdx]);
        nodeToIndex[nodes[targetIdx].id] = targetIdx;

        // Update all edges in the entire graph that pointed to lastIdx -> targetIdx
        for (size_t u = 0; u < nodes.size(); ++u) {
            for (auto& edge : adjacencyList[u]) {
                if (edge.target == lastIdx) {
                    edge.target = targetIdx;
                }
            }
        }
    }

    // Step 3: Remove the last slot and erase the removed node ID from map
    nodes.pop_back();
    adjacencyList.pop_back();
    nodeToIndex.erase(id);

    return true;
}

void Graph::addEdge(const std::string& source, const std::string& target, double weight) {
    int u = getNodeIndex(source);
    int v = getNodeIndex(target);

    if (config.weighted && weight < 0.0) {
        throw std::invalid_argument("Negative edge weights are not supported: " + std::to_string(weight));
    }

    if (!config.allowSelfLoops && u == v) {
        throw std::invalid_argument("Self-loops are not allowed: " + source + " -> " + target);
    }

    if (!config.allowDuplicateEdges && hasEdge(u, v)) {
        throw std::invalid_argument("Duplicate edge not allowed between '" + source + "' and '" + target + "'.");
    }

    double actualWeight = config.weighted ? weight : 1.0;

    auto insertSorted = [&](int from, int to, double w) {
        const std::string& toId = nodes[to].id;
        auto& edges = adjacencyList[from];
        auto it = std::lower_bound(edges.begin(), edges.end(), toId,
            [this](const Edge& e, const std::string& id) {
                return nodes[e.target].id < id;
            });
        edges.insert(it, Edge(to, w));
    };

    if (config.directed) {
        insertSorted(u, v, actualWeight);
        edgeCount++;
    } else {
        insertSorted(u, v, actualWeight);
        if (u != v) {
            insertSorted(v, u, actualWeight);
        }
        edgeCount++;
    }
}

bool Graph::removeEdge(const std::string& source, const std::string& target) {
    if (!hasNode(source) || !hasNode(target)) {
        return false;
    }

    int u = nodeToIndex[source];
    int v = nodeToIndex[target];

    auto& edgesU = adjacencyList[u];
    auto itU = std::find_if(edgesU.begin(), edgesU.end(),
        [v](const Edge& e) { return e.target == v; });

    if (itU == edgesU.end()) {
        return false;
    }

    edgesU.erase(itU);

    if (!config.directed && u != v) {
        auto& edgesV = adjacencyList[v];
        auto itV = std::find_if(edgesV.begin(), edgesV.end(),
            [u](const Edge& e) { return e.target == u; });
        if (itV != edgesV.end()) {
            edgesV.erase(itV);
        }
    }

    edgeCount--;
    return true;
}

bool Graph::hasEdge(int u, int v) const {
    if (u < 0 || static_cast<size_t>(u) >= adjacencyList.size()) {
        return false;
    }
    if (v < 0 || static_cast<size_t>(v) >= nodes.size()) {
        return false;
    }

    const auto& edges = adjacencyList[u];
    const std::string& targetId = nodes[v].id;
    auto it = std::lower_bound(edges.begin(), edges.end(), targetId,
        [this](const Edge& e, const std::string& id) {
            return nodes[e.target].id < id;
        });
    return (it != edges.end() && it->target == v);
}

bool Graph::hasEdge(const std::string& source, const std::string& target) const {
    auto itU = nodeToIndex.find(source);
    auto itV = nodeToIndex.find(target);
    if (itU == nodeToIndex.end() || itV == nodeToIndex.end()) {
        return false;
    }
    return hasEdge(itU->second, itV->second);
}

void Graph::sortAdjacencyLists() {
    for (size_t u = 0; u < adjacencyList.size(); ++u) {
        std::sort(adjacencyList[u].begin(), adjacencyList[u].end(),
            [this](const Edge& a, const Edge& b) {
                return nodes[a.target].id < nodes[b.target].id;
            });
    }
}

double Graph::getEdgeWeight(const std::string& source, const std::string& target) const {
    int u = getNodeIndex(source);
    int v = getNodeIndex(target);

    const auto& edges = adjacencyList[u];
    auto it = std::find_if(edges.begin(), edges.end(),
        [v](const Edge& e) { return e.target == v; });

    if (it == edges.end()) {
        throw std::out_of_range("No edge exists from '" + source + "' to '" + target + "'.");
    }

    return it->weight;
}

void Graph::setEdgeWeight(const std::string& source, const std::string& target, double weight) {
    if (config.weighted && weight < 0.0) {
        throw std::invalid_argument("Negative edge weights are not supported: " + std::to_string(weight));
    }

    int u = getNodeIndex(source);
    int v = getNodeIndex(target);

    auto& edgesU = adjacencyList[u];
    auto itU = std::find_if(edgesU.begin(), edgesU.end(),
        [v](const Edge& e) { return e.target == v; });

    if (itU == edgesU.end()) {
        throw std::out_of_range("No edge exists from '" + source + "' to '" + target + "'.");
    }

    double actualWeight = config.weighted ? weight : 1.0;
    itU->weight = actualWeight;

    if (!config.directed && u != v) {
        auto& edgesV = adjacencyList[v];
        auto itV = std::find_if(edgesV.begin(), edgesV.end(),
            [u](const Edge& e) { return e.target == u; });
        if (itV != edgesV.end()) {
            itV->weight = actualWeight;
        }
    }
}

const std::vector<Edge>& Graph::getNeighbors(int nodeIndex) const {
    if (nodeIndex < 0 || static_cast<size_t>(nodeIndex) >= nodes.size()) {
        throw std::out_of_range("Node index " + std::to_string(nodeIndex) + " out of range.");
    }
    return adjacencyList[nodeIndex];
}

const std::vector<Edge>& Graph::getNeighbors(const std::string& id) const {
    return getNeighbors(getNodeIndex(id));
}

std::vector<ExternalEdge> Graph::getAllEdges() const {
    std::vector<ExternalEdge> result;
    result.reserve(edgeCount);

    for (size_t u = 0; u < nodes.size(); ++u) {
        for (const auto& edge : adjacencyList[u]) {
            if (config.directed) {
                result.emplace_back(nodes[u].id, nodes[edge.target].id, edge.weight);
            } else {
                // In undirected graphs, only report each edge once: when u <= edge.target
                if (static_cast<int>(u) <= edge.target) {
                    result.emplace_back(nodes[u].id, nodes[edge.target].id, edge.weight);
                }
            }
        }
    }

    return result;
}

void Graph::clear() {
    nodes.clear();
    nodeToIndex.clear();
    adjacencyList.clear();
    edgeCount = 0;
}
