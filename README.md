# PathForge — Interactive Graph Pathfinding & Optimization Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](https://opensource.org/licenses/MIT)
[![C++17](https://img.shields.io/badge/Language-C%2B%2B17-blue.svg)](https://isocpp.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-cyan.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_%2B_Express-green.svg)](https://nodejs.org/)

**PathForge** is an interactive, web-based algorithmic laboratory designed to visualize, analyze, and benchmark graph data structures and pathfinding algorithms.

Designed with a **DSA-First** architecture, all graph search and optimization algorithms run natively in high-performance C++, streamed to an interactive visual workbench built with React and TypeScript.

---

## 🏛 Architecture

```text
React 18 + TypeScript (Interactive Graph Visualizer & Workbench)
                  │ HTTP / JSON REST Requests
                  ▼
Node.js + Express + TypeScript (Input Validation & Process Manager)
                  │ JSON via stdin / stdout
                  ▼
C++ Algorithm Engine (Graph Core, Adjacency List & Pathfinding Kernel)
```

### Core Design Principles

1. **Native C++ DSA Primacy**: All core graph representations and traversal/pathfinding algorithms (BFS, DFS, Dijkstra, A*) are implemented from first principles in native C++17. No external pathfinding libraries are used.
2. **Database-Free Operation**: The entire application runs strictly in runtime memory. No SQL, NoSQL, or external databases are required. Graph state is saved and loaded via clean client-side JSON export/import.
3. **Safe Inter-Process Communication (IPC)**: The Node.js server spawns the compiled C++ binary using `child_process.spawn()`, streaming validated JSON payloads over `stdin` and parsing results from `stdout`.
4. **Dual Execution Modes**:
   * **Visualization Mode**: Generates granular step-by-step trace events (`visit_node`, `examine_edge`, `enqueue_node`, etc.) for playback animation.
   * **Benchmark Mode**: Runs algorithm kernels without trace events for high-throughput scaling benchmarks on large graphs.
5. **Graphite + Amber Visual Identity**: A clean, technical, high-density engineering workbench aesthetic inspired by professional developer tools.

---

## 📁 Repository Structure

```text
PathForge/
├── engine/              # Native C++17 Algorithm Engine
│   ├── CMakeLists.txt   # CMake configuration
│   ├── include/         # Header definitions
│   │   └── graph/       # Graph, Node, Edge data structures
│   ├── src/             # Core C++ implementation
│   │   ├── graph/       # Adjacency list and lifecycle logic
│   │   └── main.cpp     # Engine entrypoint
│   └── tests/           # GoogleTest unit test suites
│
├── server/              # Node.js + Express + TypeScript API Server
│   ├── src/             # Express routes, controllers, and IPC bridge
│   ├── tests/           # Vitest integration tests
│   └── tsconfig.json    # Strict TypeScript configuration
│
├── client/              # React 18 + TypeScript + Vite Frontend
│   ├── src/             # Workbench UI, Canvas, and Controls
│   ├── index.html       # Single-page application entrypoint
│   └── vite.config.ts   # Vite bundler & API proxy configuration
│
├── AGENTS.md            # Agent instructions, architectural invariants & rules
├── package.json         # Workspace scripts and root orchestrator
└── README.md            # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

* **C++ Compiler**: GCC ($\ge 9$), Clang ($\ge 10$), or MSVC ($\ge 2019$) with C++17 support
* **Build System**: [CMake](https://cmake.org/) ($\ge 3.16$) and [Ninja](https://ninja-build.org/)
* **Node.js**: Node.js ($\ge 18.0.0$) and `npm`

### 1. Build the Native C++ Engine

```bash
# Configure and build the C++ engine
cmake -S engine -B engine/build -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build engine/build

# Run C++ unit tests via CTest
ctest --test-dir engine/build --output-on-failure
```

### 2. Start the Backend API Server

```bash
# Install server dependencies
cd server
npm install

# Run the API in development mode (port 5000)
npm run dev
```

### 3. Start the Frontend Visual Workbench

```bash
# Install client dependencies
cd client
npm install

# Run the Vite dev server (port 3000)
npm run dev
```

Open your browser at [http://localhost:3000](http://localhost:3000).

---

## 🧪 Testing

PathForge maintains automated tests across all tiers:

```bash
# Test C++ algorithm core (GoogleTest)
npm run test:engine

# Test API server endpoints (Vitest)
npm run test:server
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
