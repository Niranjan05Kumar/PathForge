#pragma once

#include <string>
#include <utility>

struct Node {
    std::string id;
    std::string label;
    double x{0.0};
    double y{0.0};

    Node() = default;

    Node(std::string id, std::string label = "", double x = 0.0, double y = 0.0)
        : id(std::move(id)),
          label(label.empty() ? this->id : std::move(label)),
          x(x),
          y(y) {}

    bool operator==(const Node& other) const {
        return id == other.id;
    }
};
