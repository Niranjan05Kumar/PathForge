#include <gtest/gtest.h>
#include "graph/Graph.h"
#include "algorithm/Dijkstra.h"

// --- 1. Weighted Optimality Test ---

TEST(DijkstraTest, SelectsLowestCostOverFewestHops) {
    GraphConfig config;
    config.directed = true;
    config.weighted = true;
    Graph g(config);

    // Route 1 (2 hops, high weight): A -> B -> D (cost = 10 + 10 = 20.0)
    // Route 2 (3 hops, low weight):  A -> C -> E -> D (cost = 1 + 1 + 1 = 3.0)
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

    AlgorithmResult result = Dijkstra::run(g, "A", "D");

    EXPECT_TRUE(result.found);
    // Dijkstra must strictly choose the lowest cost path (Route 2)
    EXPECT_EQ(result.path, (std::vector<std::string>{"A", "C", "E", "D"}));
    EXPECT_DOUBLE_EQ(result.cost, 3.0);
    EXPECT_GT(result.metrics.edgeRelaxations, 0u);
}

// --- 2. Cycle Handling with Weighted Paths ---

TEST(DijkstraTest, HandlesCyclesAndMultiplePaths) {
    GraphConfig config;
    config.directed = false;
    config.weighted = true;
    Graph g(config);

    g.addNode("A");
    g.addNode("B");
    g.addNode("C");
    g.addNode("D");

    g.addEdge("A", "B", 2.0);
    g.addEdge("B", "C", 3.0);
    g.addEdge("A", "C", 6.0);
    g.addEdge("C", "D", 1.0);
    g.addEdge("B", "D", 7.0);

    AlgorithmResult result = Dijkstra::run(g, "A", "D");

    EXPECT_TRUE(result.found);
    // Optimal path: A -> B (2.0) -> C (3.0) -> D (1.0) = 6.0
    EXPECT_EQ(result.path, (std::vector<std::string>{"A", "B", "C", "D"}));
    EXPECT_DOUBLE_EQ(result.cost, 6.0);
}

// --- 3. Zero-Weight Edge Handling ---

TEST(DijkstraTest, ZeroWeightEdgesAllowed) {
    GraphConfig config;
    config.directed = true;
    config.weighted = true;
    Graph g(config);

    g.addNode("A");
    g.addNode("B");
    g.addNode("C");
    g.addNode("D");

    g.addEdge("A", "B", 0.0);
    g.addEdge("B", "C", 0.0);
    g.addEdge("C", "D", 4.5);

    AlgorithmResult result = Dijkstra::run(g, "A", "D");

    EXPECT_TRUE(result.found);
    EXPECT_EQ(result.path, (std::vector<std::string>{"A", "B", "C", "D"}));
    EXPECT_DOUBLE_EQ(result.cost, 4.5);
}

// --- 4. Rejection of Negative Edge Weights ---

TEST(DijkstraTest, NegativeEdgeWeightsRejected) {
    GraphConfig config;
    config.directed = true;
    config.weighted = true;
    Graph g(config);

    g.addNode("A");
    g.addNode("B");

    // Negative edge weights are strictly forbidden in Dijkstra
    EXPECT_THROW(g.addEdge("A", "B", -2.5), std::invalid_argument);
}

// --- 5. Source Equals Destination ---

TEST(DijkstraTest, SourceEqualsDestination) {
    Graph g;
    g.addNode("Solo");

    AlgorithmResult result = Dijkstra::run(g, "Solo", "Solo");

    EXPECT_TRUE(result.found);
    EXPECT_EQ(result.path, (std::vector<std::string>{"Solo"}));
    EXPECT_DOUBLE_EQ(result.cost, 0.0);
    EXPECT_EQ(result.metrics.nodesVisited, 1u);
    EXPECT_EQ(result.metrics.edgesExamined, 0u);
    EXPECT_EQ(result.metrics.edgeRelaxations, 0u);
}

// --- 6. Disconnected Graph ---

TEST(DijkstraTest, DisconnectedGraphNoPath) {
    GraphConfig config;
    config.directed = true;
    Graph g(config);

    g.addNode("A");
    g.addNode("B");
    g.addNode("C");

    g.addEdge("A", "B", 1.0);

    AlgorithmResult result = Dijkstra::run(g, "A", "C");

    EXPECT_FALSE(result.found);
    EXPECT_TRUE(result.path.empty());
    EXPECT_DOUBLE_EQ(result.cost, 0.0);
    ASSERT_FALSE(result.steps.empty());
    EXPECT_EQ(result.steps.back().action, "no_path");
}

// --- 7. Deterministic Tie Breaking ---

TEST(DijkstraTest, DeterministicTieBreaking) {
    GraphConfig config;
    config.directed = true;
    Graph g(config);

    // Two identical cost routes: A -> B -> D (cost 2) and A -> C -> D (cost 2)
    g.addNode("A");
    g.addNode("B");
    g.addNode("C");
    g.addNode("D");

    g.addEdge("A", "C", 1.0);
    g.addEdge("A", "B", 1.0);
    g.addEdge("C", "D", 1.0);
    g.addEdge("B", "D", 1.0);

    AlgorithmResult result1 = Dijkstra::run(g, "A", "D");
    AlgorithmResult result2 = Dijkstra::run(g, "A", "D");

    EXPECT_TRUE(result1.found);
    EXPECT_EQ(result1.path, result2.path);
    EXPECT_EQ(result1.path, (std::vector<std::string>{"A", "B", "D"}));
}

// --- 8. Step Trace Verification ---

TEST(DijkstraTest, TraceRecordingEvents) {
    GraphConfig config;
    config.directed = true;
    Graph g(config);

    g.addNode("A");
    g.addNode("B");
    g.addEdge("A", "B", 5.0);

    AlgorithmOptions traceOptions(true);
    AlgorithmResult withTrace = Dijkstra::run(g, "A", "B", traceOptions);

    EXPECT_TRUE(withTrace.found);
    EXPECT_FALSE(withTrace.steps.empty());

    bool foundRelaxEvent = false;
    for (const auto& step : withTrace.steps) {
        if (step.action == "relax_edge") {
            foundRelaxEvent = true;
            EXPECT_EQ(step.nodeId, "A");
            EXPECT_EQ(step.targetId, "B");
            EXPECT_DOUBLE_EQ(step.edgeWeight, 5.0);
        }
    }
    EXPECT_TRUE(foundRelaxEvent);

    // Direct execution: no trace
    AlgorithmOptions noTraceOptions(false);
    AlgorithmResult withoutTrace = Dijkstra::run(g, "A", "B", noTraceOptions);
    EXPECT_TRUE(withoutTrace.steps.empty());
    EXPECT_EQ(withoutTrace.path, withTrace.path);
    EXPECT_DOUBLE_EQ(withoutTrace.cost, withTrace.cost);
}

// --- 9. Out of Range Node Query ---

TEST(DijkstraTest, NonExistentEndpointsThrow) {
    Graph g;
    g.addNode("A");
    g.addNode("B");

    EXPECT_THROW(Dijkstra::run(g, "Missing", "B"), std::out_of_range);
    EXPECT_THROW(Dijkstra::run(g, "A", "Missing"), std::out_of_range);
}
