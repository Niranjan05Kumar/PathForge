#include <gtest/gtest.h>
#include "graph/Graph.h"
#include "algorithm/BFS.h"

// --- 1. Linear Graph Shortest Path ---

TEST(BFSTest, SimpleLinearGraph) {
    GraphConfig config;
    config.directed = true;
    config.weighted = false;
    Graph g(config);

    g.addNode("A");
    g.addNode("B");
    g.addNode("C");
    g.addNode("D");

    g.addEdge("A", "B");
    g.addEdge("B", "C");
    g.addEdge("C", "D");

    AlgorithmResult result = BFS::run(g, "A", "D");

    EXPECT_TRUE(result.found);
    EXPECT_EQ(result.path, (std::vector<std::string>{"A", "B", "C", "D"}));
    EXPECT_DOUBLE_EQ(result.cost, 3.0);
    EXPECT_EQ(result.metrics.nodesVisited, 4u);
    EXPECT_EQ(result.metrics.edgesExamined, 3u);
}

// --- 2. Minimum Hops Guarantee ---

TEST(BFSTest, UnweightedShortestHopsGuarantee) {
    GraphConfig config;
    config.directed = true;
    config.weighted = true;
    Graph g(config);

    // Route 1 (2 hops, high weight): A -> B -> D (weights 10 + 10 = 20)
    // Route 2 (3 hops, low weight):  A -> C -> E -> D (weights 1 + 1 + 1 = 3)
    g.addNode("A");
    g.addNode("B");
    g.addNode("C");
    g.addNode("E");
    g.addNode("D");

    g.addEdge("A", "B", 10.0);
    g.addEdge("B", "D", 10.0);

    g.addEdge("A", "C", 1.0);
    g.addEdge("C", "E", 1.0);
    g.addEdge("E", "D", 1.0);

    AlgorithmResult result = BFS::run(g, "A", "D");

    EXPECT_TRUE(result.found);
    // BFS prioritizes minimum hops (2 hops over 3 hops)
    EXPECT_EQ(result.path, (std::vector<std::string>{"A", "B", "D"}));
    EXPECT_DOUBLE_EQ(result.cost, 20.0);
}

// --- 3. Edge Cases: Source Equals Destination ---

TEST(BFSTest, SourceEqualsDestination) {
    Graph g;
    g.addNode("A");

    AlgorithmResult result = BFS::run(g, "A", "A");

    EXPECT_TRUE(result.found);
    EXPECT_EQ(result.path, (std::vector<std::string>{"A"}));
    EXPECT_DOUBLE_EQ(result.cost, 0.0);
    EXPECT_EQ(result.metrics.nodesVisited, 1u);
    EXPECT_EQ(result.metrics.edgesExamined, 0u);
    EXPECT_FALSE(result.steps.empty());
    EXPECT_EQ(result.steps.front().action, "visit_node");
    EXPECT_EQ(result.steps.back().action, "finalize_path");
}

// --- 4. Disconnected Graph ---

TEST(BFSTest, DisconnectedGraphNoRoute) {
    GraphConfig config;
    config.directed = true;
    Graph g(config);

    g.addNode("A");
    g.addNode("B");
    g.addNode("C");
    g.addNode("D");

    // Component 1: A -> B
    g.addEdge("A", "B", 1.0);

    // Component 2: C -> D
    g.addEdge("C", "D", 1.0);

    AlgorithmResult result = BFS::run(g, "A", "D");

    EXPECT_FALSE(result.found);
    EXPECT_TRUE(result.path.empty());
    EXPECT_DOUBLE_EQ(result.cost, 0.0);
    EXPECT_EQ(result.metrics.nodesVisited, 2u); // Visited A and B
    ASSERT_FALSE(result.steps.empty());
    EXPECT_EQ(result.steps.back().action, "no_path");
}

// --- 5. Deterministic Tie Breaking ---

TEST(BFSTest, DeterministicAlphabeticalTieBreaking) {
    GraphConfig config;
    config.directed = true;
    Graph g(config);

    // Node A connects to both C and B
    // Both B and C connect to D with 1 hop
    g.addNode("A");
    g.addNode("B");
    g.addNode("C");
    g.addNode("D");

    // Add in reverse alphabetical order to ensure sorting logic takes effect
    g.addEdge("A", "C", 1.0);
    g.addEdge("A", "B", 1.0);
    g.addEdge("C", "D", 1.0);
    g.addEdge("B", "D", 1.0);

    // Since B is alphabetically before C, BFS explores B first, finding path via B
    AlgorithmResult result1 = BFS::run(g, "A", "D");
    AlgorithmResult result2 = BFS::run(g, "A", "D");

    EXPECT_TRUE(result1.found);
    EXPECT_EQ(result1.path, (std::vector<std::string>{"A", "B", "D"}));
    EXPECT_EQ(result1.path, result2.path); // Guaranteed reproducible
}

// --- 6. Step Trace Recording & Toggle ---

TEST(BFSTest, TraceRecordingToggle) {
    GraphConfig config;
    config.directed = true;
    Graph g(config);

    g.addNode("A");
    g.addNode("B");
    g.addNode("C");
    g.addEdge("A", "B", 1.0);
    g.addEdge("B", "C", 1.0);

    // Mode 1: Trace Enabled
    AlgorithmOptions traceOptions(true);
    AlgorithmResult withTrace = BFS::run(g, "A", "C", traceOptions);
    EXPECT_FALSE(withTrace.steps.empty());

    // Verify step sequence
    int expectedStep = 1;
    for (const auto& step : withTrace.steps) {
        EXPECT_EQ(step.step, expectedStep++);
        EXPECT_FALSE(step.action.empty());
        EXPECT_FALSE(step.description.empty());
    }

    // Mode 2: Trace Disabled (Direct execution)
    AlgorithmOptions noTraceOptions(false);
    AlgorithmResult withoutTrace = BFS::run(g, "A", "C", noTraceOptions);
    EXPECT_TRUE(withoutTrace.steps.empty());
    EXPECT_TRUE(withoutTrace.found);
    EXPECT_EQ(withoutTrace.path, withTrace.path);
    EXPECT_DOUBLE_EQ(withoutTrace.cost, withTrace.cost);
}

// --- 7. Error Handling for Non-existent Nodes ---

TEST(BFSTest, NonExistentNodesThrow) {
    Graph g;
    g.addNode("A");
    g.addNode("B");

    EXPECT_THROW(BFS::run(g, "Ghost", "B"), std::out_of_range);
    EXPECT_THROW(BFS::run(g, "A", "Ghost"), std::out_of_range);
}
