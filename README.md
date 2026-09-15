# PathForge — Interactive Graph Pathfinding & Optimization Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](https://opensource.org/licenses/MIT)
[![C++17](https://img.shields.io/badge/Language-C%2B%2B17-blue.svg)](https://isocpp.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-cyan.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_%2B_Express-green.svg)](https://nodejs.org/)
[![Database: None](https://img.shields.io/badge/Database-Zero_Databases_(100%25_In--Memory)-orange.svg)](https://github.com/Niranjan05Kumar/PathForge)

**PathForge** is an interactive, web-based algorithmic laboratory designed to visualize, analyze, and benchmark graph data structures and shortest-path algorithms.

Designed with a strict **DSA-First (Data Structures & Algorithms-First)** philosophy, all graph algorithms execute natively in high-performance C++17, streamed via safe inter-process communication (IPC) to an interactive visual workbench built with React, TypeScript, and a Graphite + Amber engineering aesthetic.

---

## 🏛 Architectural Hierarchy

```text
React 18 + TypeScript (Interactive Visualization, Canvas Editor & Benchmark Dashboard)
        │
        │ HTTP / JSON REST Requests (localhost:5000)
        ▼
Node.js + Express + TypeScript (Input Validation, Route Handlers & Child Process Manager)
        │
        │ Validated JSON streaming via stdin / stdout (spawn --ipc)
        ▼
C++ Algorithm Engine (Adjacency List, Custom IndexedMinHeap, Search Kernels & Benchmark Harness)
```

PathForge strictly decouples responsibilities across its three tiers:
1. **C++ Algorithm Engine (`/engine`)**: The intellectual core. Implements custom adjacency lists, dual-indexing hash maps, custom binary min-heaps with $O(\log V)$ decrease-key, deterministic graph generators, and isolated multi-run kernel benchmarking.
2. **Node.js Express Server (`/server`)**: The API and process manager. Pre-validates payloads against strict schemas, enforces 15s to 30s process timeout guards, spawns the C++ binary securely via `child_process.spawn()`, and returns standardized JSON envelopes.
3. **React Client (`/client`)**: The visual laboratory. Provides an interactive SVG canvas editor with draggable nodes, real-time edge weight editing, a bi-directional stepped playback engine with keyboard shortcuts, and a high-scale benchmark dashboard with comparative bar charts.

---

## ⚡ Key Features

* **Interactive Graph Canvas Editor**:
  * Freeform vertex placement, drag-and-drop repositioning, bidirectional edge connection, and inline weight editing.
  * Topological presets: Simple Triangle, Diamond Network, 3x3 Grid, Weighted Transit Map, Dense Cluster, Disconnected Components, Cycle Stress Network.
  * Canvas quick-generator synthesizing Grid, Tree, Sparse, Random, and Dense topologies directly onto the canvas.
* **Stepped Playback Engine & Trace Animator**:
  * Bi-directional step scrubber: `Play`, `Pause`, `Step Forward`, `Step Backward`, `Jump to Start`, `Jump to End`.
  * Discrete speed controller (0.25x, 0.5x, 1x, 2x, Max).
  * WCAG 2.1 AA accessible visual indicators: animated amber current pulse (`anim-pulse-current`), cyan frontier breathing halo (`anim-pulse-frontier`), emerald edge relaxation wave (`anim-edge-relax`), and non-color letter badges (`"S"`, `"D"`, `"C"`, `"F"`, `"V"`).
  * Interactive `Step Trace` panel with filterable events and click-to-scrub event navigation.
  * Global keyboard navigation: `[Space]` for Play/Pause, `[← / →]` for step scrubbing, `[Home / End]` for timeline endpoints.
* **High-Scale Synthetic Graph Generation**:
  * Deterministic, reproducible generation using pseudo-random seeds (`std::mt19937_64`).
  * Topologies: **Random (Erdős–Rényi)**, **Sparse** ($E \approx 3V$), **Dense** ($E \approx 0.25 \cdot V^2$), **2D Grid**, and **Tree** ($E = V - 1$).
  * Admissible coordinate edge weighting guaranteeing monotonic consistency and **100% cost parity** between Dijkstra and A*.
* **Multi-Run Benchmark Dashboard**:
  * Scale presets: Small ($100$), Medium ($1,000$), Large ($10,000$), and Extreme ($100,000$ vertices).
  * High-resolution timing isolating C++ kernel time (`std::chrono::high_resolution_clock`) from serialization overhead.
  * Multi-run statistics: Min, Mean, Max, and Standard Deviation ($\sigma$) execution times.
  * Traversal metrics: Average nodes visited, edges examined, and edge relaxations.
  * Comparative horizontal bar charts for kernel runtime and search space pruning efficiency.
  * Live **Cost Parity Verification Badge** verifying exact path cost equivalence between Dijkstra and A*.
* **100% Database-Free JSON Portability**:
  * **Graph Import**: Upload any standard JSON graph with strict schema validation, unique ID enforcement, and user-friendly error banners.
  * **Graph Export**: Download active canvas topologies into portable JSON files.
  * **Experiment Export**: Download analytical experiment snapshots (topology, chosen endpoints, computed path, cost, traversal metrics, and timestamps) for reproducible research.

---

## 📊 Algorithm Complexity & Data Structure Matrix

| Algorithm / Structure | Time Complexity (Worst) | Time Complexity (Average) | Space Complexity | Optimality Guarantee | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Adjacency List** | $O(1)$ add node / edge | $O(1)$ amortized | $O(V + E)$ | N/A | Dual indexing (`id -> int`, `int -> id`) for contiguous memory access |
| **IndexedMinHeap** | $O(\log V)$ push / pop / decrease-key | $O(\log V)$ | $O(V)$ | N/A | Custom binary min-heap with position index tracking for $O(1)$ key lookup |
| **BFS (Breadth-First)** | $O(V + E)$ | $O(V + E)$ | $O(V)$ | **Shortest hops** (unweighted) | Uses `std::queue<int>`; deterministic alphabetical tie-breaking |
| **Iterative DFS** | $O(V + E)$ | $O(V + E)$ | $O(V)$ | Non-optimal | Explicit `std::stack<int>` preventing recursion stack overflow |
| **Dijkstra's Algorithm** | $O((V + E) \log V)$ | $O((V + E) \log V)$ | $O(V)$ | **Strictly optimal** ($w \ge 0$) | Custom `IndexedMinHeap` with non-negative edge relaxation |
| **A\* Search (Zero)** | $O((V + E) \log V)$ | $O((V + E) \log V)$ | $O(V)$ | **Strictly optimal** | Equivalence baseline matching Dijkstra's exact cost |
| **A\* Search (Euclidean)** | $O((V + E) \log V)$ | Prunes up to 70%+ of states | $O(V)$ | **Strictly optimal** ($h \le c^*$) | Straight-line distance $L_2$; admissible on coordinate networks |
| **A\* Search (Manhattan)** | $O((V + E) \log V)$ | Prunes up to 80%+ on grids | $O(V)$ | **Strictly optimal** on 4-way grids | Grid distance $L_1$; strictly admissible on orthogonal meshes |

---

## 🛡 Defense of the 7 Key Architectural Decisions

### 1. Database-Free Mandate
* **Decision**: PathForge strictly forbids PostgreSQL, SQLite, MongoDB, Redis, or ORMs. All state resides in runtime process memory.
* **Justification**: PathForge is an algorithmic laboratory, not a commercial CRUD portal. Eliminating databases guarantees zero-configuration setup upon cloning, zero migration friction, and lightning-fast sub-millisecond in-memory graph traversals. State persistence is handled cleanly and transparently through client-side JSON import and export.

### 2. Native C++ DSA Engine Primacy
* **Decision**: Graph search algorithms are implemented exclusively in native C++17 and never duplicated in JavaScript or TypeScript.
* **Justification**: V8 JavaScript engine incurs garbage collection pauses, pointer indirection overhead, and unpredictable JIT deoptimizations that skew scientific benchmarks. C++ provides cache-coherent flat vector storage, deterministic RAII memory management, and nanosecond-level microsecond timers via `std::chrono::high_resolution_clock`.

### 3. First-Principles Implementation (Zero External Pathfinding Libraries)
* **Decision**: No external algorithm libraries (such as Boost.Graph, NetworkX, Graphology, or Cytoscape plugins) are used.
* **Justification**: Using third-party black-box libraries conceals the data structure mechanics that PathForge is specifically designed to expose. Building the Adjacency List, custom `IndexedMinHeap`, predecessor tracking, and edge relaxation from first principles guarantees complete architectural defensibility in technical code reviews and systems interviews.

### 4. Safe Inter-Process Communication (IPC) via `child_process.spawn()`
* **Decision**: Node.js communicates with the compiled C++ binary using `child_process.spawn()`, streaming JSON over `stdin`/`stdout`. `child_process.exec()` is strictly forbidden.
* **Justification**: `child_process.exec()` concatenates arguments into a system shell string, creating critical command injection vulnerabilities. `spawn()` invokes the executable directly with explicit argument arrays, prevents shell interpretation, supports memory-efficient streaming, and allows clean process termination (`SIGTERM` $\to$ `SIGKILL`) under a 15-second execution timeout guard.

### 5. Dual Execution Modes: Visualization vs Benchmark
* **Decision**: The C++ engine supports two distinct modes: `visualize` (generating step trace events) and `benchmark` (omitting trace events).
* **Justification**: For graphs with $V \ge 10,000$, generating granular step events (`visit_node`, `examine_edge`, `enqueue_node`) produces gigabytes of JSON, saturating OS pipe buffers and causing browser memory exhaustion. Benchmark Mode strips trace recording, isolating pure algorithm kernel search times and allowing 10,000+ node graphs to execute in under 5 milliseconds.

### 6. Abstract 2D Coordinate Plane vs GIS/Mapping APIs
* **Decision**: Graph nodes exist on an abstract Cartesian plane ($x, y \in [0, 1000]$) rather than real-world geographic mapping SDKs (Mapbox, Leaflet, Google Maps).
* **Justification**: Geographic mapping libraries introduce massive bundle sizes, vendor API keys, tile network latency, and spherical geodesy calculations ($L_2$ vs Haversine) that distract from core graph data structures. An abstract 2D coordinate plane keeps the application lightweight, mathematically pure, and fully functional offline.

### 7. Strict Algorithmic Laboratory Scope Boundaries
* **Decision**: Explicitly excludes user accounts, authentication tokens, payment gateways, and social collaboration features.
* **Justification**: PathForge is designed as an elite, focused computer science workbench. Bloating the codebase with generic SaaS authentication and CRUD models dilutes the project's intellectual focus on advanced data structures, algorithmic efficiency, and low-level performance analysis.

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
* **C++ Compiler**: GCC ($\ge 9$), Clang ($\ge 10$), or MSVC ($\ge 2019$) supporting C++17.
* **Build Tools**: [CMake](https://cmake.org/) ($\ge 3.16$) and [Ninja](https://ninja-build.org/) (or Make).
* **Node.js**: Node.js ($\ge 18.0.0$) and `npm`.

### 1. Clone the Repository
```bash
git clone https://github.com/Niranjan05Kumar/PathForge.git
cd PathForge
```

### 2. Build and Test the Native C++ Engine
```bash
# Configure and compile C++ engine & test suites
cmake -S engine -B engine/build -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build engine/build

# Execute all 64 automated GoogleTest unit tests
ctest --test-dir engine/build --output-on-failure
```

### 3. Install & Start Backend API Server
```bash
cd server
npm install
npm run dev
# Server listening on http://localhost:5000
```

### 4. Install & Start Frontend Workbench
```bash
cd ../client
npm install
npm run dev
# Visual Workbench active on http://localhost:3000
```

---

## 🐳 Docker Deployment (Multi-Stage Container)

PathForge includes a multi-stage `Dockerfile` that compiles the C++17 engine in Debian Bookworm, builds the React frontend and TypeScript server, and serves the entire application in a single lightweight container:

```bash
# Build the production container image
docker build -t pathforge:latest .

# Run the container (binds API and static workbench to port 5000)
docker run -p 5000:5000 pathforge:latest
```

Open `http://localhost:5000` in any browser to access the complete application with zero external dependencies.

---

## 🧪 Automated Testing Summary

PathForge enforces automated testing at every layer:

* **C++ Engine Unit Tests (`engine/tests/`)**:
  * **64/64 tests passing** in under 1.0 second.
  * Graph lifecycle, cascade edge deletion, BFS unweighted shortest path, iterative DFS cycle resilience, Dijkstra priority queue relaxation, A* heuristic admissibility and cost parity, deterministic graph generation, and 2,000-node stress benchmarks.
* **Node.js Integration & Regression Suite (`server/tests/`)**:
  * **25/25 tests passing** in under 1.5 seconds.
  * Pre-execution validation, `/api/pathfind`, `/api/compare`, `/api/benchmark/run`, `/api/graph/generate`, and all 8 mandatory specification edge cases (Empty Graph, Single Node, $S=D$, Disconnected Components, Zero Weights, Negative Weights, Missing Coordinates, and C++ Process Crash Resilience).
* **React Production Build (`client/`)**:
  * Compiled via Vite and TypeScript in under 1.0 second with zero type errors.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
