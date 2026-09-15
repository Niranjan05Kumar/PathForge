#pragma once

#include <string>
#include <vector>
#include <utility>

struct TraceEvent {
    int step{0};
    std::string action;       // "visit_node", "examine_edge", "enqueue_node", "push_node", "update_parent", "finalize_path", "no_path"
    std::string nodeId;       // Primary node ID
    std::string targetId;     // Target node ID (for edge actions)
    double edgeWeight{0.0};   // Weight of edge examined
    std::vector<std::string> frontier; // Snapshot of nodes currently in queue/stack
    std::vector<std::string> visited;  // Chronological or set snapshot of visited nodes
    std::string description;  // Human-readable explanation

    TraceEvent() = default;

    TraceEvent(int step, std::string action, std::string nodeId, std::string targetId = "",
               double edgeWeight = 0.0, std::vector<std::string> frontier = {},
               std::vector<std::string> visited = {}, std::string description = "")
        : step(step),
          action(std::move(action)),
          nodeId(std::move(nodeId)),
          targetId(std::move(targetId)),
          edgeWeight(edgeWeight),
          frontier(std::move(frontier)),
          visited(std::move(visited)),
          description(std::move(description)) {}
};
