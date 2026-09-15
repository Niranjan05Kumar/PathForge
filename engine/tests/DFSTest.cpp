#include <gtest/gtest.h>
#include "graph/Graph.h"
#include "algorithm/DFS.h"

// --- 1. Basic Path Discovery ---

TEST(DFSTest, SimpleConnectedGraph) {
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

    AlgorithmResult result = DFS::run(g, "A", "D");

    EXPECT_TRUE(result.found);
    EXPECT_EQ(result.path, (std::vector<std::string>{"A", "B", "C", "D"}));
    EXPECT_DOUBLE_EQ(result.cost, 3.0);
    EXPECT_GT(result.metrics.nodesVisited, 0u);
}

// --- 2. Cycle Handling ---

TEST(DFSTest, CycleHandlingWithoutInfiniteLoops) {
    GraphConfig config;
    config.directed = false;
    Graph g(config);

    // Triangle cycle with tail: A-B, B-C, C-A, C-D
    g.addNode("A");
    g.addNode("B");
    g.addNode("C");
    g.addNode("D");

    g.addEdge("A", "B", 1.0);
    g.addEdge("B", "C", 1.0);
    g.addEdge("C", "A", 1.0);
    g.addEdge("C", "D", 1.0);

    AlgorithmResult result = DFS::run(g, "A", "D");

    EXPECT_TRUE(result.found);
    EXPECT_FALSE(result.path.empty());
    EXPECT_EQ(result.path.front(), "A");
    EXPECT_EQ(result.path.back(), "D");
}

// --- 3. Deep Graph Scalability (No Stack Overflow) ---

TEST(DFSTest, DeepLineGraphIterativeStack) {
    GraphConfig config;
    config.directed = true;
    config.weighted = true;
    Graph g(config);

    // Create a 5,000-node line graph to verify that iterative stack handles
    // extreme recursion depths without running into call stack overflow.
    const int N = 5000;
    for (int i = 0; i < N; ++i) {
        g.addNode(std::to_string(i));
    }
    for (int i = 0; i < N - 1; ++i) {
        g.addEdge(std::to_string(i), std::to_string(i + 1), 1.0);
    }

    AlgorithmOptions options(false); // Disable trace for high throughput
    AlgorithmResult result = DFS::run(g, "0", std::to_string(N - 1), options);

    EXPECT_TRUE(result.found);
    EXPECT_EQ(result.path.size(), static_cast<size_t>(N));
    EXPECT_EQ(result.path.front(), "0");
    EXPECT_EQ(result.path.back(), std::to_string(N - 1));
    EXPECT_DOUBLE_EQ(result.cost, static_cast<double>(N - 1));
}

// --- 4. Source Equals Destination ---

TEST(DFSTest, SourceEqualsDestination) {
    Graph g;
    g.addNode("A");

    AlgorithmResult result = DFS::run(g, "A", "A");

    EXPECT_TRUE(result.found);
    EXPECT_EQ(result.path, (std::vector<std::string>{"A"}));
    EXPECT_DOUBLE_EQ(result.cost, 0.0);
    EXPECT_EQ(result.metrics.nodesVisited, 1u);
    EXPECT_EQ(result.metrics.edgesExamined, 0u);
}

// --- 5. Disconnected Graph ---

TEST(DFSTest, DisconnectedGraphNoRoute) {
    GraphConfig config;
    config.directed = true;
    Graph g(config);

    g.addNode("A");
    g.addNode("B");
    g.addNode("C");

    g.addEdge("A", "B", 1.0);

    AlgorithmResult result = DFS::run(g, "A", "C");

    EXPECT_FALSE(result.found);
    EXPECT_TRUE(result.path.empty());
    EXPECT_DOUBLE_EQ(result.cost, 0.0);
}

// --- 6. Step Trace Recording ---

TEST(DFSTest, StepTraceSequence) {
    GraphConfig config;
    config.directed = true;
    Graph g(config);

    g.addNode("A");
    g.addNode("B");
    g.addEdge("A", "B", 2.5);

    AlgorithmOptions traceOptions(true);
    AlgorithmResult result = DFS::run(g, "A", "B", traceOptions);

    EXPECT_TRUE(result.found);
    EXPECT_FALSE(result.steps.empty());

    int expectedStep = 1;
    for (const auto& step : result.steps) {
        EXPECT_EQ(step.step, expectedStep++);
        EXPECT_FALSE(step.action.empty());
    }
}

// --- 7. Non-Existent Nodes Error Handling ---

TEST(DFSTest, NonExistentNodesThrow) {
    Graph g;
    g.addNode("A");
    g.addNode("B");

    EXPECT_THROW(DFS::run(g, "NonExistent", "B"), std::out_of_range);
    EXPECT_THROW(DFS::run(g, "A", "NonExistent"), std::out_of_range);
}
