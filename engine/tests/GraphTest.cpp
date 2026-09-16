#include <gtest/gtest.h>
#include "graph/Graph.h"

// --- 1. Vertex / Node Lifecycle Tests ---

TEST(GraphTest, AddNodeAndQueryAttributes) {
    Graph g;
    int idxA = g.addNode("A", "Node Alpha", 10.5, 20.5);
    int idxB = g.addNode("B", "Node Beta", 30.0, 40.0);

    EXPECT_EQ(idxA, 0);
    EXPECT_EQ(idxB, 1);
    EXPECT_EQ(g.getVertexCount(), 2u);

    EXPECT_TRUE(g.hasNode("A"));
    EXPECT_TRUE(g.hasNode("B"));
    EXPECT_FALSE(g.hasNode("C"));

    EXPECT_EQ(g.getNodeIndex("A"), 0);
    EXPECT_EQ(g.getNodeIndex("B"), 1);

    EXPECT_EQ(g.getNodeId(0), "A");
    EXPECT_EQ(g.getNodeId(1), "B");

    const Node& nodeA = g.getNode(0);
    EXPECT_EQ(nodeA.id, "A");
    EXPECT_EQ(nodeA.label, "Node Alpha");
    EXPECT_DOUBLE_EQ(nodeA.x, 10.5);
    EXPECT_DOUBLE_EQ(nodeA.y, 20.5);

    const Node& nodeB = g.getNode("B");
    EXPECT_EQ(nodeB.id, "B");
    EXPECT_EQ(nodeB.label, "Node Beta");
    EXPECT_DOUBLE_EQ(nodeB.x, 30.0);
    EXPECT_DOUBLE_EQ(nodeB.y, 40.0);
}

TEST(GraphTest, DefaultLabelFallback) {
    Graph g;
    g.addNode("A"); // No label provided
    EXPECT_EQ(g.getNode("A").label, "A");
}

TEST(GraphTest, UpdateCoordinates) {
    Graph g;
    g.addNode("A", "Node Alpha", 0.0, 0.0);
    g.updateNodeCoordinates("A", 123.4, 567.8);

    const Node& node = g.getNode("A");
    EXPECT_DOUBLE_EQ(node.x, 123.4);
    EXPECT_DOUBLE_EQ(node.y, 567.8);
}

TEST(GraphTest, RejectEmptyOrDuplicateNodeId) {
    Graph g;
    EXPECT_THROW(g.addNode(""), std::invalid_argument);

    g.addNode("A");
    EXPECT_THROW(g.addNode("A"), std::invalid_argument);
}

TEST(GraphTest, OutOfBoundsNodeQueriesThrow) {
    Graph g;
    g.addNode("A");

    EXPECT_THROW(g.getNodeIndex("Z"), std::out_of_range);
    EXPECT_THROW(g.getNodeId(-1), std::out_of_range);
    EXPECT_THROW(g.getNodeId(5), std::out_of_range);
    EXPECT_THROW(g.getNode(-1), std::out_of_range);
    EXPECT_THROW(g.getNode(5), std::out_of_range);
}

// --- 2. Directed Edge Operations ---

TEST(GraphTest, DirectedEdgeOperations) {
    GraphConfig config;
    config.directed = true;
    Graph g(config);

    g.addNode("A");
    g.addNode("B");
    g.addNode("C");

    g.addEdge("A", "B", 4.5);
    g.addEdge("B", "C", 2.0);

    EXPECT_EQ(g.getEdgeCount(), 2u);
    EXPECT_TRUE(g.hasEdge("A", "B"));
    EXPECT_FALSE(g.hasEdge("B", "A")); // Directed!
    EXPECT_TRUE(g.hasEdge("B", "C"));
    EXPECT_FALSE(g.hasEdge("A", "C"));

    EXPECT_DOUBLE_EQ(g.getEdgeWeight("A", "B"), 4.5);
    EXPECT_DOUBLE_EQ(g.getEdgeWeight("B", "C"), 2.0);

    // Update weight
    g.setEdgeWeight("A", "B", 7.25);
    EXPECT_DOUBLE_EQ(g.getEdgeWeight("A", "B"), 7.25);

    // Check neighbors
    const auto& aNeighbors = g.getNeighbors("A");
    ASSERT_EQ(aNeighbors.size(), 1u);
    EXPECT_EQ(aNeighbors[0].target, g.getNodeIndex("B"));
    EXPECT_DOUBLE_EQ(aNeighbors[0].weight, 7.25);

    // Remove edge
    EXPECT_TRUE(g.removeEdge("A", "B"));
    EXPECT_EQ(g.getEdgeCount(), 1u);
    EXPECT_FALSE(g.hasEdge("A", "B"));
    EXPECT_FALSE(g.removeEdge("A", "B")); // Already removed
}

// --- 3. Undirected Edge Operations ---

TEST(GraphTest, UndirectedEdgeReciprocity) {
    GraphConfig config;
    config.directed = false;
    Graph g(config);

    g.addNode("A");
    g.addNode("B");
    g.addEdge("A", "B", 3.0);

    EXPECT_EQ(g.getEdgeCount(), 1u); // 1 logical edge
    EXPECT_TRUE(g.hasEdge("A", "B"));
    EXPECT_TRUE(g.hasEdge("B", "A")); // Symmetrical

    EXPECT_DOUBLE_EQ(g.getEdgeWeight("A", "B"), 3.0);
    EXPECT_DOUBLE_EQ(g.getEdgeWeight("B", "A"), 3.0);

    // Update weight reflects on both directions
    g.setEdgeWeight("A", "B", 8.0);
    EXPECT_DOUBLE_EQ(g.getEdgeWeight("A", "B"), 8.0);
    EXPECT_DOUBLE_EQ(g.getEdgeWeight("B", "A"), 8.0);

    // GetAllEdges returns edge once
    auto allEdges = g.getAllEdges();
    ASSERT_EQ(allEdges.size(), 1u);
    EXPECT_EQ(allEdges[0].source, "A");
    EXPECT_EQ(allEdges[0].target, "B");
    EXPECT_DOUBLE_EQ(allEdges[0].weight, 8.0);

    // Remove edge removes both directions
    EXPECT_TRUE(g.removeEdge("B", "A"));
    EXPECT_EQ(g.getEdgeCount(), 0u);
    EXPECT_FALSE(g.hasEdge("A", "B"));
    EXPECT_FALSE(g.hasEdge("B", "A"));
}

// --- 4. Validation: Negative Weights, Self-Loops & Duplicates ---

TEST(GraphTest, NegativeWeightRejection) {
    Graph g;
    g.addNode("A");
    g.addNode("B");

    EXPECT_THROW(g.addEdge("A", "B", -1.0), std::invalid_argument);

    g.addEdge("A", "B", 2.0);
    EXPECT_THROW(g.setEdgeWeight("A", "B", -0.1), std::invalid_argument);
}

TEST(GraphTest, ZeroWeightEdgeAllowed) {
    Graph g;
    g.addNode("A");
    g.addNode("B");

    EXPECT_NO_THROW(g.addEdge("A", "B", 0.0));
    EXPECT_DOUBLE_EQ(g.getEdgeWeight("A", "B"), 0.0);
}

TEST(GraphTest, SelfLoopDisallowedByDefault) {
    Graph g;
    g.addNode("A");

    EXPECT_THROW(g.addEdge("A", "A", 1.0), std::invalid_argument);
}

TEST(GraphTest, SelfLoopAllowedWhenConfigured) {
    GraphConfig config;
    config.allowSelfLoops = true;
    Graph g(config);

    g.addNode("A");
    EXPECT_NO_THROW(g.addEdge("A", "A", 2.5));
    EXPECT_TRUE(g.hasEdge("A", "A"));
    EXPECT_EQ(g.getEdgeCount(), 1u);
}

TEST(GraphTest, DuplicateEdgesDisallowedByDefault) {
    Graph g;
    g.addNode("A");
    g.addNode("B");

    g.addEdge("A", "B", 1.0);
    EXPECT_THROW(g.addEdge("A", "B", 2.0), std::invalid_argument);
}

TEST(GraphTest, NonExistentEndpointsThrowOnAddEdge) {
    Graph g;
    g.addNode("A");

    EXPECT_THROW(g.addEdge("A", "Ghost", 1.0), std::out_of_range);
    EXPECT_THROW(g.addEdge("Ghost", "A", 1.0), std::out_of_range);
}

// --- 5. Cascade Node Deletion & Contiguous Index Integrity ---

TEST(GraphTest, CascadeNodeDeletionDirected) {
    GraphConfig config;
    config.directed = true;
    Graph g(config);

    g.addNode("A");
    g.addNode("B");
    g.addNode("C");
    g.addNode("D");

    // A -> B, B -> C, C -> D, D -> B, A -> D
    g.addEdge("A", "B", 1.0);
    g.addEdge("B", "C", 2.0);
    g.addEdge("C", "D", 3.0);
    g.addEdge("D", "B", 4.0);
    g.addEdge("A", "D", 5.0);
    EXPECT_EQ(g.getEdgeCount(), 5u);

    // Remove node B (incident edges: A->B, B->C, D->B = 3 edges)
    EXPECT_TRUE(g.removeNode("B"));
    EXPECT_FALSE(g.hasNode("B"));
    EXPECT_EQ(g.getVertexCount(), 3u);
    EXPECT_EQ(g.getEdgeCount(), 2u); // Remaining: C->D and A->D

    // Verify all vertex indices are strictly [0, 1, 2]
    for (size_t i = 0; i < g.getVertexCount(); ++i) {
        std::string id = g.getNodeId(static_cast<int>(i));
        EXPECT_EQ(g.getNodeIndex(id), static_cast<int>(i));
    }

    // Remaining edges should still work accurately
    EXPECT_TRUE(g.hasEdge("C", "D"));
    EXPECT_TRUE(g.hasEdge("A", "D"));
    EXPECT_DOUBLE_EQ(g.getEdgeWeight("C", "D"), 3.0);
    EXPECT_DOUBLE_EQ(g.getEdgeWeight("A", "D"), 5.0);
}

TEST(GraphTest, CascadeNodeDeletionUndirected) {
    GraphConfig config;
    config.directed = false;
    Graph g(config);

    g.addNode("A");
    g.addNode("B");
    g.addNode("C");

    // Triangle: A-B, B-C, C-A
    g.addEdge("A", "B", 1.0);
    g.addEdge("B", "C", 2.0);
    g.addEdge("C", "A", 3.0);
    EXPECT_EQ(g.getEdgeCount(), 3u);

    // Remove B: removes A-B and B-C
    EXPECT_TRUE(g.removeNode("B"));
    EXPECT_EQ(g.getVertexCount(), 2u);
    EXPECT_EQ(g.getEdgeCount(), 1u);

    EXPECT_FALSE(g.hasEdge("A", "B"));
    EXPECT_FALSE(g.hasEdge("B", "C"));
    EXPECT_TRUE(g.hasEdge("C", "A"));
    EXPECT_TRUE(g.hasEdge("A", "C"));
}

TEST(GraphTest, RemoveNonExistentNodeReturnsFalse) {
    Graph g;
    g.addNode("A");
    EXPECT_FALSE(g.removeNode("NonExistent"));
    EXPECT_EQ(g.getVertexCount(), 1u);
}

TEST(GraphTest, SingleNodeGraphLifecycle) {
    Graph g;
    g.addNode("Solo");
    EXPECT_EQ(g.getVertexCount(), 1u);
    EXPECT_TRUE(g.removeNode("Solo"));
    EXPECT_EQ(g.getVertexCount(), 0u);
    EXPECT_FALSE(g.hasNode("Solo"));
}

// --- 6. Clear and Reset ---

TEST(GraphTest, ClearResetsAllStructures) {
    Graph g;
    g.addNode("A");
    g.addNode("B");
    g.addEdge("A", "B", 1.5);

    g.clear();
    EXPECT_EQ(g.getVertexCount(), 0u);
    EXPECT_EQ(g.getEdgeCount(), 0u);
    EXPECT_FALSE(g.hasNode("A"));
    EXPECT_FALSE(g.hasNode("B"));

    // Can add nodes and edges again cleanly
    g.addNode("X");
    g.addNode("Y");
    g.addEdge("X", "Y", 10.0);
    EXPECT_EQ(g.getVertexCount(), 2u);
    EXPECT_EQ(g.getEdgeCount(), 1u);
    EXPECT_TRUE(g.hasEdge("X", "Y"));
}

// --- 7. Fast Index-Based Queries and Sorting Invariants ---

TEST(GraphTest, IndexBasedHasEdgeOperation) {
    Graph g;
    int a = g.addNode("A");
    int b = g.addNode("B");
    int c = g.addNode("C");

    g.addEdge("A", "B", 1.0);

    EXPECT_TRUE(g.hasEdge(a, b));
    EXPECT_TRUE(g.hasEdge(b, a));
    EXPECT_FALSE(g.hasEdge(a, c));
    EXPECT_FALSE(g.hasEdge(b, c));
    EXPECT_FALSE(g.hasEdge(-1, 0));
    EXPECT_FALSE(g.hasEdge(0, 99));
}

TEST(GraphTest, SortedAdjacencyListMaintainsDeterministicOrder) {
    GraphConfig config;
    config.directed = true;
    Graph g(config);

    g.addNode("Root");
    g.addNode("Delta");
    g.addNode("Alpha");
    g.addNode("Charlie");
    g.addNode("Bravo");

    // Add edges in random order
    g.addEdge("Root", "Delta", 4.0);
    g.addEdge("Root", "Alpha", 1.0);
    g.addEdge("Root", "Charlie", 3.0);
    g.addEdge("Root", "Bravo", 2.0);

    const auto& neighbors = g.getNeighbors("Root");
    ASSERT_EQ(neighbors.size(), 4u);
    EXPECT_EQ(g.getNodeId(neighbors[0].target), "Alpha");
    EXPECT_EQ(g.getNodeId(neighbors[1].target), "Bravo");
    EXPECT_EQ(g.getNodeId(neighbors[2].target), "Charlie");
    EXPECT_EQ(g.getNodeId(neighbors[3].target), "Delta");
}

