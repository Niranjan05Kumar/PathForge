#include <gtest/gtest.h>
#include "benchmark/GraphGenerator.h"
#include "benchmark/Benchmark.h"
#include "ipc/JsonBridge.h"
#include <nlohmann/json.hpp>
#include <chrono>

using json = nlohmann::json;

TEST(BenchmarkTest, SeedDeterminism) {
    GraphGeneratorOptions opts1;
    opts1.nodes = 50;
    opts1.topology = "random";
    opts1.seed = 987654321ULL;

    Graph g1 = GraphGenerator::generate(opts1);

    GraphGeneratorOptions opts2 = opts1;
    Graph g2 = GraphGenerator::generate(opts2);

    EXPECT_EQ(g1.getVertexCount(), g2.getVertexCount());
    EXPECT_EQ(g1.getEdgeCount(), g2.getEdgeCount());

    for (size_t i = 0; i < g1.getVertexCount(); ++i) {
        std::string id = g1.getNodeId(static_cast<int>(i));
        const auto& n1 = g1.getNode(id);
        const auto& n2 = g2.getNode(id);
        EXPECT_DOUBLE_EQ(n1.x, n2.x);
        EXPECT_DOUBLE_EQ(n1.y, n2.y);
    }
}

TEST(BenchmarkTest, GridTopologyProperties) {
    Graph g = GraphGenerator::generateGrid(4, 5, false, true, 12345);
    EXPECT_EQ(g.getVertexCount(), 20U);
    // Grid 4x5 undirected has 4*(5-1) + 5*(4-1) = 16 + 15 = 31 edges
    EXPECT_EQ(g.getEdgeCount(), 31U);

    EXPECT_TRUE(g.hasNode("grid_0_0"));
    EXPECT_TRUE(g.hasNode("grid_3_4"));
    EXPECT_TRUE(g.hasEdge("grid_0_0", "grid_0_1"));
    EXPECT_TRUE(g.hasEdge("grid_0_0", "grid_1_0"));
    EXPECT_FALSE(g.hasEdge("grid_0_0", "grid_3_4"));
}

TEST(BenchmarkTest, TreeTopologyProperties) {
    int V = 64;
    Graph g = GraphGenerator::generateTree(V, false, true, 42);
    EXPECT_EQ(g.getVertexCount(), static_cast<size_t>(V));
    EXPECT_EQ(g.getEdgeCount(), static_cast<size_t>(V - 1));
}

TEST(BenchmarkTest, MultiRunBenchmarkCalculations) {
    Graph g = GraphGenerator::generateSparse(60, false, true, 42, 3);
    std::string src = "node_0";
    std::string dst = "node_59";

    std::vector<BenchmarkAlgorithmConfig> algs = {
        {"dijkstra", ""},
        {"astar", "euclidean"},
        {"bfs", ""}
    };

    BenchmarkSuiteResult suite = Benchmark::runSuite(g, src, dst, algs, 5, "sparse", 42);

    EXPECT_EQ(suite.runs, 5);
    EXPECT_EQ(suite.results.size(), 3U);
    EXPECT_TRUE(suite.costMatch);

    for (const auto& r : suite.results) {
        EXPECT_TRUE(r.found);
        EXPECT_LE(r.minTimeMs, r.avgTimeMs);
        EXPECT_LE(r.avgTimeMs, r.maxTimeMs);
        EXPECT_GE(r.stdDevTimeMs, 0.0);
        EXPECT_GT(r.avgNodesVisited, 0.0);
    }
}

TEST(BenchmarkTest, DijkstraAndAStarCostParity) {
    Graph g = GraphGenerator::generateDense(35, 0.3, false, true, 100);
    std::string src = "node_0";
    std::string dst = "node_34";

    std::vector<BenchmarkAlgorithmConfig> algs = {
        {"dijkstra", ""},
        {"astar", "euclidean"}
    };

    BenchmarkSuiteResult suite = Benchmark::runSuite(g, src, dst, algs, 3, "dense", 100);

    EXPECT_TRUE(suite.costMatch);
    ASSERT_EQ(suite.results.size(), 2U);
    EXPECT_TRUE(suite.results[0].pathCost.has_value());
    EXPECT_TRUE(suite.results[1].pathCost.has_value());
    EXPECT_NEAR(suite.results[0].pathCost.value(), suite.results[1].pathCost.value(), 1e-4);
}

TEST(BenchmarkTest, StressBenchmarkExecution) {
    // 2,000 nodes, ~6,000 edges executed in Benchmark Mode
    auto start = std::chrono::high_resolution_clock::now();
    Graph g = GraphGenerator::generateSparse(2000, false, true, 777, 3);
    std::vector<BenchmarkAlgorithmConfig> algs = {{"dijkstra", ""}};
    BenchmarkSuiteResult suite = Benchmark::runSuite(g, "node_0", "node_1999", algs, 3, "sparse", 777);
    auto end = std::chrono::high_resolution_clock::now();

    double totalElapsedMs = std::chrono::duration<double, std::milli>(end - start).count();
    EXPECT_LT(totalElapsedMs, 1000.0); // Must execute under 1 second
    EXPECT_EQ(suite.results.size(), 1U);
    EXPECT_TRUE(suite.results[0].found);
}

TEST(BenchmarkTest, JsonBridgeBenchmarkCommand) {
    json req = {
        {"command", "benchmark"},
        {"runs", 3},
        {"graphConfig", {
            {"nodes", 40},
            {"topology", "grid"},
            {"seed", 42}
        }},
        {"algorithms", {
            {"algorithm", "dijkstra"},
            {"algorithm", "astar", "heuristic", "manhattan"}
        }}
    };

    std::string resStr = JsonBridge::processString(req.dump());
    json res = json::parse(resStr);

    EXPECT_TRUE(res.value("success", false));
    EXPECT_TRUE(res.contains("results"));
    EXPECT_EQ(res["results"].size(), 2U);
    EXPECT_TRUE(res.value("costMatch", false));
}

TEST(BenchmarkTest, JsonBridgeGenerateGraphCommand) {
    json req = {
        {"command", "generate_graph"},
        {"graphConfig", {
            {"nodes", 25},
            {"topology", "tree"},
            {"seed", 99}
        }}
    };

    std::string resStr = JsonBridge::processString(req.dump());
    json res = json::parse(resStr);

    EXPECT_TRUE(res.value("success", false));
    EXPECT_EQ(res["nodeCount"].get<int>(), 25);
    EXPECT_EQ(res["edgeCount"].get<int>(), 24); // Tree with 25 nodes has 24 edges
    EXPECT_TRUE(res.contains("nodes"));
    EXPECT_TRUE(res.contains("edges"));
}
