#pragma once

#include <vector>
#include <utility>
#include <stdexcept>
#include <cstddef>

struct HeapEntry {
    int node{-1};
    double key{0.0};

    HeapEntry() = default;
    HeapEntry(int node, double key) : node(node), key(key) {}
};

class IndexedMinHeap {
private:
    std::vector<HeapEntry> heap;
    std::vector<int> nodeToPos; // Maps node index -> position in heap vector (-1 if absent)

    void swapEntries(size_t i, size_t j) {
        std::swap(heap[i], heap[j]);
        nodeToPos[heap[i].node] = static_cast<int>(i);
        nodeToPos[heap[j].node] = static_cast<int>(j);
    }

    void siftUp(size_t i) {
        while (i > 0) {
            size_t p = (i - 1) / 2;
            if (heap[i].key < heap[p].key) {
                swapEntries(i, p);
                i = p;
            } else {
                break;
            }
        }
    }

    void siftDown(size_t i) {
        size_t n = heap.size();
        while (2 * i + 1 < n) {
            size_t left = 2 * i + 1;
            size_t right = 2 * i + 2;
            size_t smallest = i;

            if (heap[left].key < heap[smallest].key) {
                smallest = left;
            }
            if (right < n && heap[right].key < heap[smallest].key) {
                smallest = right;
            }

            if (smallest != i) {
                swapEntries(i, smallest);
                i = smallest;
            } else {
                break;
            }
        }
    }

    void ensureCapacity(int node) {
        if (node < 0) {
            throw std::out_of_range("Negative node index not permitted in IndexedMinHeap.");
        }
        if (static_cast<size_t>(node) >= nodeToPos.size()) {
            nodeToPos.resize(static_cast<size_t>(node) + 1, -1);
        }
    }

public:
    explicit IndexedMinHeap(size_t initialCapacity = 0) {
        if (initialCapacity > 0) {
            nodeToPos.assign(initialCapacity, -1);
            heap.reserve(initialCapacity);
        }
    }

    bool empty() const {
        return heap.empty();
    }

    size_t size() const {
        return heap.size();
    }

    bool contains(int node) const {
        if (node < 0 || static_cast<size_t>(node) >= nodeToPos.size()) {
            return false;
        }
        return nodeToPos[node] != -1;
    }

    double getKey(int node) const {
        if (!contains(node)) {
            throw std::out_of_range("Node is not present in IndexedMinHeap.");
        }
        return heap[nodeToPos[node]].key;
    }

    void push(int node, double key) {
        ensureCapacity(node);
        if (contains(node)) {
            if (key < heap[nodeToPos[node]].key) {
                decreaseKey(node, key);
            }
            return;
        }

        size_t i = heap.size();
        heap.emplace_back(node, key);
        nodeToPos[node] = static_cast<int>(i);
        siftUp(i);
    }

    HeapEntry pop() {
        if (heap.empty()) {
            throw std::underflow_error("IndexedMinHeap is empty.");
        }

        HeapEntry minEntry = heap[0];
        size_t last = heap.size() - 1;

        if (last > 0) {
            swapEntries(0, last);
        }

        nodeToPos[minEntry.node] = -1;
        heap.pop_back();

        if (!heap.empty()) {
            siftDown(0);
        }

        return minEntry;
    }

    void decreaseKey(int node, double newKey) {
        if (!contains(node)) {
            throw std::out_of_range("Node not found in heap for decreaseKey.");
        }

        size_t i = static_cast<size_t>(nodeToPos[node]);
        if (newKey > heap[i].key) {
            return; // Only decrease key
        }

        heap[i].key = newKey;
        siftUp(i);
    }

    std::vector<int> getNodesInHeap() const {
        std::vector<int> nodes;
        nodes.reserve(heap.size());
        for (const auto& entry : heap) {
            nodes.push_back(entry.node);
        }
        return nodes;
    }

    void clear() {
        heap.clear();
        std::fill(nodeToPos.begin(), nodeToPos.end(), -1);
    }
};
