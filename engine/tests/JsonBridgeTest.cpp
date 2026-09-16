#include <gtest/gtest.h>
#include "ipc/JsonBridge.h"
#include <nlohmann/json.hpp>

using json = nlohmann::json;

TEST(JsonBridgeTest, ValidDijkstraRequest) {
    json request = {
        {"algorithm", "dijkstra"},
        {"source", "A"},
        {"target", "C"},
        {"mode", "visualize"},
        {"graph", {
            {"directed", false},
            {"weighted", true},
            {"nodes", {
                {{"id", "A"}, {"x", 0.0}, {"y", 0.0}},
                {{"id", "B"}, {"x", 5.0}, {"y", 0.0}},
                {{"id", "C"}, {"x", 10.0}, {"y", 0.0}}
            }},
            {"edges", {
                {{"source", "A"}, {"target", "B"}, {"weight", 3.0}},
                {{"source", "B"}, {"target", "C"}, {"weight", 4.0}}
            }}
        }}
    };

    std::string responseStr = JsonBridge::processString(request.dump());
    json response = json::parse(responseStr);

    EXPECT_TRUE(response["success"].get<bool>());
    EXPECT_TRUE(response["data"]["found"].get<bool>());
    EXPECT_DOUBLE_EQ(response["data"]["cost"].get<double>(), 7.0);

    auto path = response["data"]["path"].get<std::vector<std::string>>();
    EXPECT_EQ(path, (std::vector<std::string>{"A", "B", "C"}));
    EXPECT_FALSE(response["data"]["steps"].empty());
}

TEST(JsonBridgeTest, TraceDisabledOmitsSteps) {
    json request = {
        {"algorithm", "bfs"},
        {"source", "A"},
        {"target", "B"},
        {"recordTrace", false},
        {"graph", {
            {"nodes", {{{"id", "A"}}, {{"id", "B"}}}},
            {"edges", {{{"source", "A"}, {"target", "B"}, {"weight", 1.0}}}}
        }}
    };

    std::string responseStr = JsonBridge::processString(request.dump());
    json response = json::parse(responseStr);

    EXPECT_TRUE(response["success"].get<bool>());
    EXPECT_TRUE(response["data"]["found"].get<bool>());
    EXPECT_TRUE(response["data"]["steps"].empty());
}

TEST(JsonBridgeTest, MissingCoordinatesErrorEnvelope) {
    json request = {
        {"algorithm", "astar"},
        {"heuristic", "euclidean"},
        {"source", "A"},
        {"target", "B"},
        {"graph", {
            // Nodes missing coordinates
            {"nodes", {{{"id", "A"}}, {{"id", "B"}}}},
            {"edges", {{{"source", "A"}, {"target", "B"}, {"weight", 1.0}}}}
        }}
    };

    std::string responseStr = JsonBridge::processString(request.dump());
    json response = json::parse(responseStr);

    EXPECT_FALSE(response["success"].get<bool>());
    EXPECT_EQ(response["error"]["code"].get<std::string>(), "MISSING_NODE_COORDINATES");
}

TEST(JsonBridgeTest, MalformedJsonRejected) {
    std::string responseStr = JsonBridge::processString("{ malformed json ... }");
    json response = json::parse(responseStr);

    EXPECT_FALSE(response["success"].get<bool>());
    EXPECT_EQ(response["error"]["code"].get<std::string>(), "INVALID_JSON");
}

TEST(JsonBridgeTest, NonExistentNodeRejected) {
    json request = {
        {"algorithm", "bfs"},
        {"source", "Ghost"},
        {"target", "B"},
        {"graph", {
            {"nodes", {{{"id", "A"}}, {{"id", "B"}}}},
            {"edges", {{{"source", "A"}, {"target", "B"}}}}
        }}
    };

    std::string responseStr = JsonBridge::processString(request.dump());
    json response = json::parse(responseStr);

    EXPECT_FALSE(response["success"].get<bool>());
    EXPECT_EQ(response["error"]["code"].get<std::string>(), "INVALID_NODE");
}
