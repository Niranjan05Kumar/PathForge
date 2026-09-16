#include <gtest/gtest.h>
#include "graph/Graph.h"
#include "algorithm/AStar.h"
#include "algorithm/Dijkstra.h"
#include "algorithm/Heuristics.h"

// --- 1. Mathematical Accuracy of Heuristics ---

TEST(AStarTest, HeuristicCalculations) {
    Node a("A", "Origin", 0.0, 0.0);
    Node b("B", "Point", 3.0, 4.0);

    EXPECT_DOUBLE_EQ(Heuristics::evaluate(HeuristicType::ZERO, a, b), 0.0);
    EXPECT_DOUBLE_EQ(Heuristics::evaluate(HeuristicType::EUCLIDEAN, a, b), 5.0);
    EXPECT_DOUBLE_EQ(Heuristics::evaluate(HeuristicType::MANHATTAN, a, b), 7.0);

    EXPECT_EQ(Heuristics::fromString("zero"), HeuristicType::ZERO);
    EXPECT_EQ(Heuristics::fromString("EUCLIDEAN"), HeuristicType::EUCLIDEAN);
    EXPECT_EQ(Heuristics::fromString("Manhattan"), HeuristicType::MANHATTAN);
    EXPECT_THROW(Heuristics::fromString("invalid"), std::invalid_argument);

    EXPECT_EQ(Heuristics::toString(HeuristicType::ZERO), "zero");
    EXPECT_EQ(Heuristics::toString(HeuristicType::EUCLIDEAN), "euclidean");
    EXPECT_EQ(Heuristics::toString(HeuristicType::MANHATTAN), "manhattan");
}

// --- 2. Zero Heuristic Cost Parity with Dijkstra ---

TEST(AStarTest, ZeroHeuristicParityWithDijkstra) {
    GraphConfig config;
    config.directed = true;
    config.weighted = true;
    Graph g(config);

    // Multi-path graph:
    // A -> B (4.0), A -> C (2.0)
    // B -> D (5.0), C -> B (1.0), C -> D (8.0), C -> E (10.0)
    // D -> Z (2.0), E -> Z (1.0)
    g.addNode("A");
    g.addNode("B");
    g.addNode("C");
    g.addNode("D");
    g.addNode("E");
    g.addNode("Z");

    g.addEdge("A", "B", 4.0);
    g.addEdge("A", "C", 2.0);
    g.addEdge("B", "D", 5.0);
    g.addEdge("C", "B", 1.0);
    g.addEdge("C", "D", 8.0);
    g.addEdge("C", "E", 10.0);
    g.addEdge("D", "Z", 2.0);
    g.addEdge("E", "Z", 1.0);

    AlgorithmResult dijkstraRes = Dijkstra::run(g, "A", "Z");

    AStarOptions astarOptions(true, HeuristicType::ZERO);
    AlgorithmResult astarRes = AStar::run(g, "A", "Z", astarOptions);

    EXPECT_TRUE(dijkstraRes.found);
    EXPECT_TRUE(astarRes.found);

    // Absolute Cost Parity Mandate
    EXPECT_DOUBLE_EQ(astarRes.cost, dijkstraRes.cost);
    EXPECT_EQ(astarRes.path, dijkstraRes.path);
    EXPECT_EQ(astarRes.metrics.nodesVisited, dijkstraRes.metrics.nodesVisited);
}

// --- 3. Euclidean Heuristic Optimality & Search Pruning ---

TEST(AStarTest, EuclideanOptimalityAndSearchPruning) {
    GraphConfig config;
    config.directed = false;
    config.weighted = true;
    Graph g(config);

    // Coordinate grid layout:
    // Start at (0, 0), Goal at (10, 0)
    // Direct path along x-axis: A(0,0) -> M(5,0) -> Z(10,0) with weights 5.0 + 5.0 = 10.0
    // Distraction nodes heading backwards: W1(-5, 0), W2(-10, 0), W3(-15, 0)
    g.addNode("A", "Start", 0.0, 0.0);
    g.addNode("M", "Mid", 5.0, 0.0);
    g.addNode("Z", "Goal", 10.0, 0.0);
    g.addNode("W1", "Wrong1", -5.0, 0.0);
    g.addNode("W2", "Wrong2", -10.0, 0.0);
    g.addNode("W3", "Wrong3", -15.0, 0.0);

    g.addEdge("A", "M", 5.0);
    g.addEdge("M", "Z", 5.0);
    g.addEdge("A", "W1", 2.0);
    g.addEdge("W1", "W2", 2.0);
    g.addEdge("W2", "W3", 2.0);

    AlgorithmResult dijkstraRes = Dijkstra::run(g, "A", "Z");

    AStarOptions euclideanOptions(true, HeuristicType::EUCLIDEAN);
    AlgorithmResult astarRes = AStar::run(g, "A", "Z", euclideanOptions);

    EXPECT_TRUE(astarRes.found);
    // Cost must match Dijkstra exactly
    EXPECT_DOUBLE_EQ(astarRes.cost, dijkstraRes.cost);
    EXPECT_EQ(astarRes.path, (std::vector<std::string>{"A", "M", "Z"}));

    // A* must visit fewer or equal nodes than Dijkstra due to directional heuristic guidance
    EXPECT_LE(astarRes.metrics.nodesVisited, dijkstraRes.metrics.nodesVisited);
}

// --- 4. Manhattan Heuristic on Grid ---

TEST(AStarTest, ManhattanGridNavigation) {
    GraphConfig config;
    config.directed = true;
    config.weighted = true;
    Graph g(config);

    // 2x2 grid:
    // (0,1) C --- D (1,1)
    //   |          |
    // (0,0) A --- B (1,0)
    g.addNode("A", "A", 0.0, 0.0);
    g.addNode("B", "B", 1.0, 0.0);
    g.addNode("C", "C", 0.0, 1.0);
    g.addNode("D", "D", 1.0, 1.0);

    g.addEdge("A", "B", 1.0);
    g.addEdge("B", "D", 1.0);
    g.addEdge("A", "C", 1.0);
    g.addEdge("C", "D", 1.0);

    AStarOptions manhattanOptions(true, HeuristicType::MANHATTAN);
    AlgorithmResult result = AStar::run(g, "A", "D", manhattanOptions);

    EXPECT_TRUE(result.found);
    EXPECT_DOUBLE_EQ(result.cost, 2.0);
}

// --- 5. Missing Coordinates Validation ---

TEST(AStarTest, RejectsGeometricHeuristicWhenCoordinatesMissing) {
    Graph g;
    // Nodes added without coordinates
    g.addNode("A");
    g.addNode("B");
    g.addEdge("A", "B", 1.0);

    AStarOptions euclideanOptions(true, HeuristicType::EUCLIDEAN);
    EXPECT_THROW({
        try {
            AStar::run(g, "A", "B", euclideanOptions);
        } catch (const std::invalid_argument& e) {
            std::string msg = e.what();
            EXPECT_NE(msg.find("MISSING_NODE_COORDINATES"), std::string::npos);
            throw;
        }
    }, std::invalid_argument);

    // Zero heuristic does NOT require coordinates
    AStarOptions zeroOptions(true, HeuristicType::ZERO);
    EXPECT_NO_THROW(AStar::run(g, "A", "B", zeroOptions));
}

// --- 6. Edge Cases: Source == Destination & Disconnected ---

TEST(AStarTest, SourceEqualsDestination) {
    Graph g;
    g.addNode("A", "Node A", 0.0, 0.0);

    AlgorithmResult result = AStar::run(g, "A", "A");
    EXPECT_TRUE(result.found);
    EXPECT_EQ(result.path, (std::vector<std::string>{"A"}));
    EXPECT_DOUBLE_EQ(result.cost, 0.0);
    EXPECT_EQ(result.metrics.nodesVisited, 1u);
}

TEST(AStarTest, DisconnectedGraphNoPath) {
    GraphConfig config;
    config.directed = true;
    Graph g(config);

    g.addNode("A", "A", 0.0, 0.0);
    g.addNode("B", "B", 1.0, 1.0);
    g.addNode("C", "C", 2.0, 2.0);

    g.addEdge("A", "B", 1.0);

    AlgorithmResult result = AStar::run(g, "A", "C");
    EXPECT_FALSE(result.found);
    EXPECT_TRUE(result.path.empty());
    EXPECT_DOUBLE_EQ(result.cost, 0.0);
    ASSERT_FALSE(result.steps.empty());
    EXPECT_EQ(result.steps.back().action, "no_path");
}

// --- 7. Step Trace Recording & Toggle ---

TEST(AStarTest, TraceRecordingEvents) {
    GraphConfig config;
    config.directed = true;
    Graph g(config);

    g.addNode("A", "A", 0.0, 0.0);
    g.addNode("B", "B", 3.0, 4.0);
    g.addEdge("A", "B", 5.0);

    AStarOptions traceOptions(true, HeuristicType::EUCLIDEAN);
    AlgorithmResult withTrace = AStar::run(g, "A", "B", traceOptions);

    EXPECT_TRUE(withTrace.found);
    EXPECT_FALSE(withTrace.steps.empty());

    bool foundRelaxEvent = false;
    for (const auto& step : withTrace.steps) {
        if (step.action == "relax_edge") {
            foundRelaxEvent = true;
            EXPECT_EQ(step.nodeId, "A");
            EXPECT_EQ(step.targetId, "B");
        }
    }
    EXPECT_TRUE(foundRelaxEvent);

    // Direct execution: trace disabled
    AStarOptions noTraceOptions(false, HeuristicType::EUCLIDEAN);
    AlgorithmResult withoutTrace = AStar::run(g, "A", "B", noTraceOptions);
    EXPECT_TRUE(withoutTrace.steps.empty());
    EXPECT_EQ(withoutTrace.path, withTrace.path);
    EXPECT_DOUBLE_EQ(withoutTrace.cost, withTrace.cost);
}
