#pragma once

#include <string>
#include <utility>

struct Node {
    std::string id;
    std::string label;
    double x{0.0};
    double y{0.0};
    bool hasCoordinates{false};

    Node() = default;

    Node(std::string id, std::string label = "")
        : id(std::move(id)),
          label(label.empty() ? this->id : std::move(label)),
          x(0.0),
          y(0.0),
          hasCoordinates(false) {}

    Node(std::string id, std::string label, double x, double y)
        : id(std::move(id)),
          label(label.empty() ? this->id : std::move(label)),
          x(x),
          y(y),
          hasCoordinates(true) {}

    bool operator==(const Node& other) const {
        return id == other.id;
    }
};
