# PathForge — Implementation Roadmap
### Phased Development Plan & Technical Milestones

---

## 1. Project Implementation Strategy

This document translates the **PathForge — Interactive Graph Pathfinding & Optimization Engine** specification into an actionable, sequential, 10-phase development roadmap.

### 1.1 Guiding Principles

1. **DSA-First Foundation**: The native C++ graph engine and algorithm implementations are the primary intellectual component. Algorithms must be implemented from first principles, tested, and verified before UI layers are constructed.
2. **Incremental Architectural Integration**: Layers are built and verified bottom-up:
   $$\text{C++ Core} \longrightarrow \text{C++ IPC Bridge} \longrightarrow \text{Node.js REST API} \longrightarrow \text{React Canvas Editor} \longrightarrow \text{Visualization Engine} \longrightarrow \text{Benchmark Dashboard}$$
3. **Independently Verifiable Phases**: Every phase produces a tangible, testable deliverable (e.g., passing unit tests, CLI execution, or interactive canvas interaction). A phase cannot be marked complete without satisfying its checklist.
4. **Strict Database-Free Mandate**: No database (SQL, NoSQL, ORM, or cache) is introduced at any phase. Application state resides strictly in runtime memory or portable JSON files.
5. **Separation of Concerns**: Core pathfinding logic remains strictly in C++. Node.js acts purely as an API and process orchestration bridge. React handles rendering, interaction, and visualization.

### 1.2 Architectural Milestones

```text
Milestone 1: Monorepo & Build Toolchain (Phase 1)
        ↓
Milestone 2: C++ DSA & Shortest Path Engine (Phases 2–5)
        ↓
Milestone 3: Native IPC & Node.js API Bridge (Phase 6)
        ↓
Milestone 4: Interactive Graph Editor & MVP Release (Phase 7) [★ MVP BOUNDARY]
        ↓
Milestone 5: Stepped Algorithm Visualization & Playback (Phase 8)
        ↓
Milestone 6: High-Scale Benchmarking & Analytics (Phase 9)
        ↓
Milestone 7: Portability, Hardening & Production Release (Phase 10)
```

---

## 2. Feature Classification: Core vs. Advanced vs. Polish

To maintain focus and avoid scope creep, project features are categorized into three distinct tiers:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ CORE FEATURES (Phases 1–7: Required for Functional MVP)                    │
│ • C++ Graph Adjacency List (Directed/Undirected, Weighted/Unweighted)       │
│ • Custom Min-Priority Queue / Binary Heap                                   │
│ • BFS, Dijkstra, and A* (Zero & Euclidean Heuristics)                       │
│ • Predecessor Tracking & Linear Path Reconstruction                         │
│ • Node.js Child Process Stdin/Stdout JSON Streaming Bridge                  │
│ • Interactive React Canvas (Add/Move/Delete Nodes & Edges)                  │
│ • Source/Destination Selection & Basic Execution Display (Path, Cost, Time)│
│ • Basic Side-by-Side Algorithm Comparison (Dijkstra vs. A*)                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ ADVANCED FEATURES (Phases 8–9: Laboratory Capabilities)                     │
│ • Dual Mode Engine: Visualization Trace vs. Benchmark Mode                  │
│ • Granular Trace Event Generation (EXPAND_NODE, RELAX_EDGE)                 │
│ • Step-by-Step Canvas Playback (Step Forward/Backward, Variable Speed)      │
│ • Deterministic Synthetic Graph Generators (Random, Sparse, Dense, Grid)    │
│ • Multi-Run Benchmark Harness (Min/Max/Mean/Std-Dev execution times)        │
│ • Large-Scale Graph Processing (10,000 to 100,000+ nodes)                   │
│ • Interactive Benchmark Comparison Charts & Analytical Tables               │
├─────────────────────────────────────────────────────────────────────────────┤
│ POLISH & HARDENING (Phase 10: Production Readiness)                         │
│ • JSON Graph Import/Export & Complete Experiment Log Export                 │
│ • Responsive Layout Adaptation (Desktop 3-Column, Tablet, Mobile Drawer)    │
│ • Full WCAG 2.1 AA Accessibility Audit (Keyboard Nav & Non-Color Cues)      │
│ • Automated End-to-End & Regression Test Suites                             │
│ • Docker Multi-Stage Build & Production Static Asset Serving                │
│ • Comprehensive README with Defensible Architectural Decisions              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Testing & Validation Progression

Testing expands systematically across the development lifecycle:

```text
Phases 1–5:  Unit Testing & Algorithm Correctness (GoogleTest)
     ↓       • Graph mutations, edge insertions, cascade deletions
             • Dijkstra & A* optimal path and cost validation against known graphs
             • Non-negative weight enforcement, disconnected graph detection

Phase 6:     Process IPC & API Integration Testing (Vitest / Supertest)
     ↓       • Stdin/stdout JSON serialization and deserialization
             • Child process timeout enforcement and crash resilience
             • Schema validation and HTTP error response mapping

Phases 7–8:  Frontend Component & Visual State Testing
     ↓       • Canvas mouse interactions (drag, select, delete)
             • Playback timer control and step-counter synchronization
             • Visual accessibility and state rendering

Phases 9–10: End-to-End, Performance & Regression Testing
             • Large-scale benchmark stress tests (10,000+ nodes)
             • Memory leak profiling (Valgrind / AddressSanitizer)
             • Bug-to-test regression coverage
```

---

## Phase 1 — Project & Toolchain Foundation

### 1. Objective
Establish the monorepo directory structure, build toolchains, dependency managers, and baseline development scripts for the C++ engine, Node.js API server, and React client. Ensure all three environments compile and pass baseline smoke tests before writing domain logic.

### 2. Complexity
* **Rating**: `Low`
* **Rationale**: Standard project scaffolding and build configuration without complex algorithmic logic.

### 3. Scope
* **Must Have**:
  * Monorepo directory skeleton: `/engine`, `/server`, `/client`, `/tests`.
  * C++ toolchain: `CMakeLists.txt` configuring C++17/20, compiler warning flags (`-Wall -Wextra -Wpedantic`), and GoogleTest dependency integration (via CMake `FetchContent`).
  * Node.js toolchain: `package.json`, `tsconfig.json`, Express, TypeScript compilation, and linting/formatting scripts.
  * React toolchain: Vite, React, TypeScript, and basic styling configuration.
  * Root-level `.env.example` and `.gitignore`.
* **Optional**:
  * Root-level `npm` script orchestrator (e.g., concurrently running server and client).

### 4. Dependencies
* None (initial phase).

### 5. Implementation Tasks
1. Initialize repository root directory with `.gitignore` and `.env.example`.
2. Scaffold `/engine` directory with CMake configuration supporting GoogleTest via `FetchContent`.
3. Create a placeholder `main.cpp` and a smoke test in `engine/tests/SmokeTest.cpp` verifying GoogleTest executes.
4. Scaffold `/server` with Express and TypeScript (`package.json`, `tsconfig.json`, `src/server.ts`).
5. Scaffold `/client` using Vite with React and TypeScript (`package.json`, `vite.config.ts`, `src/App.tsx`).
6. Configure root-level build commands in `README.md` or root scripts.

### 6. Expected Deliverable
A fully buildable monorepo where:
* `cmake --build build` compiles the C++ executable.
* `ctest` executes and passes the GoogleTest smoke test.
* `npm run build` succeeds in both `/server` and `/client`.

### 7. Testing & Validation
* **Unit Tests**: `engine/tests/SmokeTest.cpp` verifies `EXPECT_TRUE(true)`.
* **Build Verification**:
  ```bash
  cd engine && cmake -S . -B build && cmake --build build && ctest --test-dir build
  cd ../server && npm install && npm run build
  cd ../client && npm install && npm run build
  ```

### 8. Completion Criteria
* [ ] C++ CMake project builds cleanly with zero compiler warnings.
* [ ] GoogleTest runner discovers and executes the smoke test.
* [ ] Node.js/Express server compiles TypeScript without type errors.
* [ ] Vite/React client compiles with clean bundle generation.
* [ ] `.env.example` is populated with `PORT=5000`, `NODE_ENV=development`, `CPP_ENGINE_PATH`.

### 9. Recommended Git Checkpoint
```text
chore: scaffold monorepo structure, toolchains, and build scripts
```

---

## Phase 2 — C++ Graph Core & Adjacency List Representation

### 1. Objective
Implement the fundamental graph data structure in C++ using an adjacency list representation. Provide memory-efficient node and edge management, fast vertex lookups, and robust structural validation.

### 2. Complexity
* **Rating**: `Medium`
* **Rationale**: Requires rigorous pointer/index management, bi-directional lookup mappings (`std::string` ID $\leftrightarrow$ contiguous `int` index), and strict edge-case handling (duplicate edges, self-loops).

### 3. Scope
* **Must Have**:
  * `Node` and `Edge` structs.
  * `Graph` class with internal adjacency list (`std::vector<std::vector<Edge>>`).
  * Bidirectional mapping between external string IDs and internal contiguous integer indices (`std::unordered_map<std::string, int>` and `std::vector<std::string>`).
  * 2D coordinate storage for vertices (`std::pair<double, double>`).
  * Configuration flags: `directed`, `weighted`, `allowDuplicateEdges`, `allowSelfLoops`.
  * Node operations: `addNode`, `removeNode`, `hasNode`, `getNodeIndex`, `getNodeId`.
  * Edge operations: `addEdge`, `removeEdge`, `hasEdge`, `getEdgeWeight`, `getNeighbors`.
  * **Cascade Edge Deletion**: Removing a node automatically strips all incident inbound and outbound edges.
* **Optional**:
  * Graph clearing and bulk reservation helpers for high-density allocation.

### 4. Dependencies
* Depends on **Phase 1** (buildable C++ toolchain and GoogleTest).

### 5. Implementation Tasks
1. Define core structs in `engine/include/graph/Node.h` and `engine/include/graph/Edge.h`.
2. Implement the `Graph` class header in `engine/include/graph/Graph.h` and implementation in `engine/src/graph/Graph.cpp`.
3. Implement string ID to integer index bi-directional conversion.
4. Implement directed and undirected edge insertion with non-negative weight validation.
5. Implement node deletion with automatic cleanup of all connected edges in the adjacency list.
6. Implement constraints rejecting self-loops and duplicate edges when disallowed by configuration.
7. Create comprehensive GoogleTest suite in `engine/tests/GraphTest.cpp`.

### 6. Expected Deliverable
A robust, standalone C++ graph library capable of modeling directed/undirected and weighted/unweighted networks with complete adjacency list operations and zero memory leaks.

### 7. Testing & Validation
* **Unit Tests (`GraphTest.cpp`)**:
  * Adding vertices and querying their existence and coordinate retention.
  * Adding directed and undirected edges and checking symmetric vs. asymmetric adjacency lists.
  * Node removal verifying that all inbound and outbound edges are completely purged.
  * Verification that self-loops ($u \to u$) are rejected when `allowSelfLoops = false`.
  * Verification that parallel edges ($u \to v$ twice) are rejected when `allowDuplicateEdges = false`.
  * Updating edge weights on existing edges.

### 8. Completion Criteria
* [ ] `Graph` class stores vertices and edges in $O(V + E)$ space.
* [ ] Internal lookup between string IDs and contiguous indices operates in $O(1)$ average time.
* [ ] Cascade deletion leaves no dangling edge references in any neighbor's adjacency list.
* [ ] All `GraphTest.cpp` test cases pass with zero failures.

### 9. Recommended Git Checkpoint
```text
feat(engine): implement adjacency list graph model with cascade deletion and unit tests
```

---

## Phase 3 — Traversal Algorithms & Path Reconstruction (BFS & DFS)

### 1. Objective
Implement Breadth-First Search (BFS) for unweighted shortest paths and iterative Depth-First Search (DFS) for connectivity exploration. Build the linear-time path reconstruction mechanism and initialize traversal metrics tracking.

### 2. Complexity
* **Rating**: `Medium`
* **Rationale**: Requires predecessor map management, reversal logic for path reconstruction, and explicit stack iteration to prevent call-stack overflow on deep topologies.

### 3. Scope
* **Must Have**:
  * Predecessor map tracking (`std::vector<int> parent`) recording edge transitions.
  * Linear-time path reconstruction utility (`reconstructPath(source, destination, parent)`).
  * Traversal metrics collection: `nodesVisited`, `edgesExamined`, `executionTimeMs`, `pathCost`.
  * **BFS Implementation**: Standard FIFO queue (`std::queue<int>`) computing hop-optimal paths. Early termination upon encountering the destination vertex.
  * **DFS Implementation**: Explicit iteration stack (`std::stack<int>`) preventing stack overflow on large or deep graphs ($V > 10,000$).
  * Clear code documentation: DFS is strictly a traversal algorithm and does not guarantee shortest paths.
  * High-resolution timer integration using `std::chrono::high_resolution_clock`.
* **Optional**:
  * Traversal order export helper.

### 4. Dependencies
* Depends on **Phase 2** (Graph data structure and adjacency lists).

### 5. Implementation Tasks
1. Define shared result structure in `engine/include/core/Result.h` containing `path`, `cost`, `nodesVisited`, `edgesExamined`, and `executionTimeMs`.
2. Implement path reconstruction in `engine/src/core/PathReconstruction.cpp`.
3. Implement BFS in `engine/include/algorithms/BFS.h` and `engine/src/algorithms/BFS.cpp`.
4. Implement iterative DFS in `engine/include/algorithms/DFS.h` and `engine/src/algorithms/DFS.cpp`.
5. Implement unit tests in `engine/tests/BFSTest.cpp` and `engine/tests/DFSTest.cpp`.

### 6. Expected Deliverable
Working BFS and DFS implementations in C++ capable of traversing graphs, tracking metrics, and reconstructing ordered vertex paths.

### 7. Testing & Validation
* **Unit Tests (`BFSTest.cpp` & `DFSTest.cpp`)**:
  * BFS returns the minimal-hop path on unweighted graphs with multiple branches.
  * BFS and DFS correctly identify unreachable destinations in disconnected graphs, returning empty paths (`[]`).
  * Source equals destination ($S = D$) returns single-node path `[S]` with cost `0.0`.
  * Single-node graph ($V = 1$) handled cleanly.
  * DFS terminates cleanly on graphs with cycles without infinite looping.
  * Deep chain graph ($V = 20,000$) tested in DFS to prove zero call-stack overflow.

### 8. Completion Criteria
* [ ] BFS guarantees the shortest path by edge count in $O(V + E)$ time.
* [ ] DFS is implemented iteratively using `std::stack` with $O(V + E)$ time and $O(V)$ auxiliary space.
* [ ] Path reconstruction generates accurate source-to-destination ordered vertex sequences.
* [ ] Disconnected nodes return structured "no path" results with `cost = null`.
* [ ] All unit tests in `BFSTest.cpp` and `DFSTest.cpp` pass cleanly.

### 9. Recommended Git Checkpoint
```text
feat(engine): implement BFS and iterative DFS with path reconstruction and metric tracking
```

---

## Phase 4 — Dijkstra's Algorithm & Custom Min-Priority Queue

### 1. Objective
Implement Dijkstra's shortest-path algorithm for weighted graphs with non-negative edge weights. Construct a custom Binary Min-Heap / Priority Queue wrapper from first principles to clearly demonstrate core DSA mechanics.

### 2. Complexity
* **Rating**: `High`
* **Rationale**: Involves custom binary heap operations (`siftUp`, `siftDown`, $O(\log V)$ `extractMin`), handling duplicate/stale heap keys via a closed set, and strict edge-relaxation tracking.

### 3. Scope
* **Must Have**:
  * **Custom Min-Priority Queue (`MinPriorityQueue`)**: Binary heap implementation storing `(priority, vertexIndex)` pairs with `insert`, `extractMin`, `isEmpty`, and `size`.
  * Non-negative weight validation: Aborts with explicit `NEGATIVE_EDGE_WEIGHT` error if any edge weight $w < 0$.
  * Distance vector initialized to $\infty$, with `dist[source] = 0.0`.
  * Closed set / visited array (`std::vector<bool> closedSet`) to filter stale heap entries.
  * Edge relaxation tracking: Increment `relaxations` count upon successful distance reduction.
  * Early exit: Terminates search immediately when the destination node is extracted from the min-heap.
  * Path reconstruction from predecessor pointers.
  * Deterministic tie-breaking for equal-cost paths (e.g., lower vertex index).
* **Optional**:
  * Indexed priority queue with `decreaseKey` operation (evaluated against standard binary heap with stale entry purging).

### 4. Dependencies
* Depends on **Phase 2** (Graph core) and **Phase 3** (Path reconstruction utilities).

### 5. Implementation Tasks
1. Implement custom binary min-heap in `engine/include/data_structures/MinPriorityQueue.h`.
2. Add unit tests for `MinPriorityQueue` verifying heap invariant maintenance during insertions and extractions.
3. Implement Dijkstra's algorithm in `engine/include/algorithms/Dijkstra.h` and `engine/src/algorithms/Dijkstra.cpp`.
4. Implement negative-weight edge validation prior to relaxation.
5. Integrate `nodesVisited`, `edgesExamined`, `relaxations`, and execution timer tracking.
6. Create unit tests in `engine/tests/DijkstraTest.cpp`.

### 6. Expected Deliverable
A verified, high-performance C++ implementation of Dijkstra's algorithm running in $O((V + E) \log V)$ time, utilizing a custom min-heap.

### 7. Testing & Validation
* **Unit Tests (`DijkstraTest.cpp`)**:
  * Correctness verified against textbook shortest-path graphs with known optimal costs.
  * Graph containing zero-weight edges ($w = 0$) processed correctly without infinite relaxation loops.
  * Graph with negative edge weight ($w < 0$) causes immediate rejection with `NEGATIVE_EDGE_WEIGHT`.
  * Graph with multiple equal-cost paths returns a valid optimal path deterministically.
  * Disconnected graph returns empty path and `cost = null`.
  * Source equals destination ($S = D$) returns single node with cost `0.0`.

### 8. Completion Criteria
* [ ] Custom `MinPriorityQueue` maintains binary heap invariants with $O(\log V)$ insertion and extraction.
* [ ] Dijkstra's algorithm computes provably optimal paths on non-negative weighted graphs.
* [ ] Negative edge weights are explicitly rejected with structured errors.
* [ ] Traversal metrics accurately report `nodesVisited`, `edgesExamined`, and `relaxations`.
* [ ] All tests in `DijkstraTest.cpp` pass cleanly.

### 9. Recommended Git Checkpoint
```text
feat(engine): implement custom binary min-heap and Dijkstra's algorithm with relaxation metrics
```

---

## Phase 5 — A* Search Algorithm & Heuristic Evaluations

### 1. Objective
Implement the A* search algorithm using the evaluation function $f(n) = g(n) + h(n)$. Implement admissible heuristic functions (Zero Heuristic, Euclidean Distance, Manhattan Distance) and verify heuristic consistency and path optimality against Dijkstra.

### 2. Complexity
* **Rating**: `High`
* **Rationale**: Requires coordinating $gScore$ and $fScore$ mappings, validating 2D geometric coordinates, counting heuristic function calls, and proving mathematical optimality equivalence with Dijkstra.

### 3. Scope
* **Must Have**:
  * Heuristic library in `engine/include/algorithms/Heuristics.h`:
    * **Zero Heuristic**: $h(n) = 0.0$ (admissible for all graphs).
    * **Euclidean Distance**: $h(n) = \sqrt{(x_n - x_{dest})^2 + (y_n - y_{dest})^2}$ (requires 2D node coordinates).
    * **Manhattan Distance**: $h(n) = |x_n - x_{dest}| + |y_n - y_{dest}|$ (requires 2D node coordinates).
  * Coordinate validation: If a geometric heuristic is selected, verify all nodes contain valid $(x, y)$ coordinates; otherwise abort with `MISSING_NODE_COORDINATES`.
  * $gScore$ and $fScore$ tracking for all vertices.
  * Open Set managed by `MinPriorityQueue` ordered by $fScore$.
  * Tracking of `heuristicCalls` alongside `nodesVisited`, `edgesExamined`, and `relaxations`.
  * Early exit when destination node is extracted from the Open Set.
  * **Optimality Parity Test**: Verifying that A* with an admissible heuristic produces the **exact same minimal path cost** as Dijkstra on the same graph instance.
* **Optional**:
  * Diagonal (Chebyshev / Octile) distance heuristic for 8-connected grid networks.

### 4. Dependencies
* Depends on **Phase 4** (Dijkstra algorithm, custom min-priority queue, and distance relaxation logic).

### 5. Implementation Tasks
1. Implement heuristic calculations in `engine/include/algorithms/Heuristics.h`.
2. Implement A* search in `engine/include/algorithms/AStar.h` and `engine/src/algorithms/AStar.cpp`.
3. Implement coordinate validation for coordinate-dependent heuristics.
4. Add metric tracking for `heuristicCalls`.
5. Create comprehensive GoogleTest suite in `engine/tests/AStarTest.cpp`.
6. Implement a comparative test verifying that A* with Zero Heuristic expands identical nodes and finds identical paths to Dijkstra.

### 6. Expected Deliverable
A fully tested C++ A* pathfinding engine with selectable heuristics, provable optimality, and node expansion metrics.

### 7. Testing & Validation
* **Unit Tests (`AStarTest.cpp`)**:
  * **Zero Heuristic Equivalence**: A* with Zero Heuristic yields identical path cost, path sequence, and node visitation to Dijkstra.
  * **Euclidean Admissibility**: On geometric 2D graphs, A* with Euclidean heuristic returns optimal cost while visiting fewer or equal nodes compared to Dijkstra.
  * **Manhattan Heuristic**: Validated on grid graphs with 4-directional movements.
  * **Missing Coordinates**: Requesting Euclidean heuristic on a graph without coordinates is rejected with `MISSING_NODE_COORDINATES`.
  * Disconnected target returns `cost = null` and empty path.

### 8. Completion Criteria
* [ ] A* correctly evaluates $f(n) = g(n) + h(n)$ with custom heuristics.
* [ ] A* with Zero Heuristic matches Dijkstra results with 100% precision.
* [ ] Geometric heuristics prune the search space (fewer nodes visited) without sacrificing path optimality.
* [ ] Invalid heuristic requests are cleanly rejected.
* [ ] All tests in `AStarTest.cpp` pass cleanly.

### 9. Recommended Git Checkpoint
```text
feat(engine): implement A* search with Zero, Euclidean, and Manhattan heuristics
```

---

## Phase 6 — C++ Engine JSON Interface & Node.js API Integration

### 1. Objective
Bridge the native C++ engine with the web application tier. Implement a stream-based JSON parser and serializer in C++ supporting both Visualization and Benchmark execution modes. Build the Node.js + Express + TypeScript API server that spawns the C++ binary, streams JSON via stdin/stdout, and exposes structured REST endpoints.

### 2. Complexity
* **Rating**: `High`
* **Rationale**: Requires robust OS-level inter-process communication (IPC), stream buffering, non-blocking process execution, execution timeout safety, and comprehensive JSON validation schemas.

### 3. Scope
* **Must Have**:
  * **C++ JSON Bridge (`JsonBridge`)**:
    * Parse input graph and command JSON from `std::cin`.
    * Serialization of result objects, metrics, and trace arrays to `std::cout`.
    * Dual execution modes:
      * **Visualization Mode**: Includes granular execution trace events (`steps: [...]`).
      * **Benchmark Mode**: Omits trace events, returning aggregate metrics only.
    * CLI execution support: `./pathforge-engine input.json`.
  * **Node.js Express + TypeScript Server**:
    * Service layer `cppEngineService.ts` using `child_process.spawn()` to manage native process lifecycle.
    * Stdin/stdout pipe streaming with buffer aggregation.
    * Process execution timeout guardrail (e.g., 15-second kill timer) to prevent hung processes.
    * Request validation middleware checking JSON syntax, required fields, and data types.
    * Error handling middleware mapping C++ stderr / exit codes to structured HTTP responses.
    * REST Endpoints:
      * `GET /api/health`: Server status and engine binary discovery check.
      * `POST /api/graph/validate`: Schema and topological validation.
      * `POST /api/algorithm/run`: Single algorithm execution.
      * `POST /api/algorithm/compare`: Multi-algorithm comparison execution.
* **Optional**:
  * Graceful process pooling / persistent worker mode for high-frequency requests.

### 4. Dependencies
* Depends on **Phase 5** (Complete C++ algorithm suite).

### 5. Implementation Tasks
1. Integrate lightweight C++ JSON library (e.g., `nlohmann/json`) via CMake in `engine/CMakeLists.txt`.
2. Implement `engine/include/serialization/JsonBridge.h` and update `engine/src/main.cpp` to parse stdin and emit stdout.
3. Add step event trace recording in C++ pathfinding algorithms when `mode == "visualization"`.
4. Scaffold Express server in `server/src/app.ts` and `server/src/server.ts`.
5. Implement `server/src/services/cppEngineService.ts` to spawn the engine and stream stdin/stdout.
6. Implement `server/src/middleware/validator.ts` and `server/src/middleware/errorHandler.ts`.
7. Implement API route controllers in `server/src/controllers/algorithmController.ts`.
8. Write backend integration tests using Vitest / Supertest verifying the end-to-end API-to-C++ pipeline.

### 6. Expected Deliverable
A fully integrated, running HTTP API server that accepts JSON pathfinding requests, delegates execution to the native C++ child process over stdin/stdout, and returns structured JSON responses.

### 7. Testing & Validation
* **Integration Tests (`server/tests/api.test.ts`)**:
  * `GET /api/health` returns HTTP 200 with engine binary discovered.
  * `POST /api/algorithm/run` with Dijkstra executes C++ engine and returns valid path and metrics.
  * `POST /api/algorithm/run` with negative weights returns HTTP 400 with structured `NEGATIVE_EDGE_WEIGHT` error.
  * Request timeout test: Simulated long-running C++ process killed after timeout with HTTP 504.
  * Stdin/stdout stress test: Graph with 1,000 nodes processed without pipe truncation or buffer overflow.

### 8. Completion Criteria
* [ ] C++ engine consumes JSON from stdin, executes algorithms, and outputs valid JSON to stdout.
* [ ] Node.js correctly spawns the C++ binary without using vulnerable shell command strings (`exec` prohibited).
* [ ] Visualization Mode includes step trace arrays; Benchmark Mode omits trace arrays.
* [ ] Invalid inputs return structured error responses with HTTP 400.
* [ ] All backend integration tests pass cleanly.

### 9. Recommended Git Checkpoint
```text
feat(server): implement Node.js API with C++ child process stdin/stdout JSON bridge
```

---

## Phase 7 — Interactive React Graph Editor & Core UI (MVP Release)

### 1. Objective
Build the interactive graph canvas and core user interface in React. Enable users to visually construct, reposition, and modify nodes and edges, select source and destination vertices, trigger C++ algorithm runs via the backend API, and display final route results and metrics. **This phase delivers the functional Minimum Viable Product (MVP).**

### 2. Complexity
* **Rating**: `High`
* **Rationale**: Involves interactive 2D canvas mathematics (drag-and-drop, coordinate mapping, vector offset calculations for edge lines and arrows), state synchronization, and async API integration.

### 3. Scope
* **Must Have**:
  * **Interactive Graph Canvas (SVG or Canvas)**:
    * Render nodes as circular SVG elements with distinct labels and coordinate positioning.
    * Render edges as lines/paths with directional arrowheads (directed) or plain segments (undirected).
    * Edge weight labels positioned at line midpoints.
    * Drag-and-drop node repositioning updating $(x, y)$ in real time.
    * Node selection for adding edges between vertices.
    * Node and edge deletion with cascade removal of connected edges.
  * **Controls Panel**:
    * Graph configuration toggles: Directed/Undirected, Weighted/Unweighted.
    * Node and edge editing tools (Add Node, Add Edge, Delete Selected, Clear All).
    * Source node picker and Destination node picker.
    * Algorithm selector: Dijkstra and A* (with Zero and Euclidean heuristics).
    * "Run Algorithm" primary action button.
    * "Compare Algorithms" button.
  * **Results Panel**:
    * Formatted route display (e.g., `A → C → F → Z`).
    * Path cost display.
    * Metrics cards: Nodes Visited, Edges Examined, Relaxations, Execution Time (ms).
    * "No Path Found" alert for disconnected nodes.
  * **MVP State**: User can create a graph, run Dijkstra and A*, view the path, and compare metrics.
* **Optional**:
  * Canvas zoom and pan navigation controls.

### 4. Dependencies
* Depends on **Phase 6** (Functional Node.js API and C++ execution bridge).

### 5. Implementation Tasks
1. Scaffold frontend layout in `client/src/pages/Workspace.tsx` (Controls Sidebar, Center Canvas, Right Results Panel).
2. Implement custom state management hook `client/src/hooks/useGraph.ts` managing nodes, edges, and configuration.
3. Build `GraphCanvas` component in `client/src/components/GraphCanvas/` using SVG rendering.
4. Implement mouse event handlers for node dragging, node selection, and edge drawing.
5. Build `GraphControls` component for toggling graph types and adding/deleting elements.
6. Build `ResultsPanel` displaying path sequence, cost, and metric cards.
7. Integrate `client/src/services/api.ts` connecting the UI to `POST /api/algorithm/run`.
8. Implement basic comparison view showing Dijkstra vs. A* execution side by side.
9. Verify all 12 MVP acceptance criteria.

### 6. Expected Deliverable
**PathForge MVP**: A complete, functional web application where a user can interactively draw a graph, run Dijkstra or A*, and inspect the resulting optimal route and performance metrics.

### 7. Testing & Validation
* **Frontend Component Tests (`client/tests/`)**:
  * Clicking "Add Node" creates a new node on the canvas.
  * Dragging a node updates its $(x, y)$ coordinates in state.
  * Deleting a node removes all connected edges.
  * Selecting Source and Destination updates visual state.
* **Manual End-to-End MVP Verification**:
  1. Construct a 5-node weighted graph.
  2. Select Node A as Source and Node E as Destination.
  3. Click "Run Dijkstra" $\to$ API executes C++ $\to$ Results panel displays correct route and cost.
  4. Click "Run A*" with Euclidean heuristic $\to$ Results panel confirms identical optimal cost with fewer nodes visited.
  5. Disconnect Node E $\to$ System displays "No route exists".

### 8. Completion Criteria
* [ ] User can add, drag, and delete nodes and edges on the interactive canvas.
* [ ] Cascade deletion cleans up all connected edges when a node is removed.
* [ ] Source and destination nodes are visually distinct on the canvas.
* [ ] Triggering execution calls the backend API and receives valid C++ results.
* [ ] Results panel accurately presents the optimal route, path cost, and execution metrics.
* [ ] Side-by-side comparison displays Dijkstra and A* metrics on the same graph instance.
* [ ] **All 12 MVP criteria from the project specification are satisfied.**

### 9. Recommended Git Checkpoint
```text
feat(client): implement interactive graph editor canvas and complete MVP release
```

---

## Phase 8 — Stepped Algorithm Visualization & Playback Engine

### 1. Objective
Transform the MVP from a static route calculator into an interactive algorithmic visualizer. Implement the client-side playback animation engine that consumes granular C++ trace steps, applies dynamic visual states (frontier, processing, visited, final path), and provides step-by-step playback controls.

### 2. Complexity
* **Rating**: `High`
* **Rationale**: Requires precise state machine modeling, animation timer management (`requestAnimationFrame` or `setTimeout`), bi-directional stepping (forward/backward), and dynamic visual styling across nodes and edges.

### 3. Scope
* **Must Have**:
  * Dynamic visual styling for all algorithm states:
    * **Source Node**: Emerald green fill, distinct `"S"` badge.
    * **Destination Node**: Amber/coral fill, distinct `"D"` badge.
    * **Frontier / Open Set**: Soft purple/blue fill with pulsing halo.
    * **Currently Processing**: High-contrast yellow highlight with active pulse indicator.
    * **Visited / Closed Set**: Muted slate/gray fill.
    * **Final Optimal Path**: Luminous cyan/gold stroke and fill with highlighted edges.
  * Playback Control Bar in `client/src/components/PlaybackControls/`:
    * `Run / Play`: Continuous automatic stepping.
    * `Pause`: Halts playback at current step.
    * `Resume`: Continues playback from paused step.
    * `Next Step`: Advances one discrete algorithm event forward.
    * `Previous Step`: Rewinds one discrete algorithm event backward.
    * `Reset`: Restores graph to pre-execution state.
  * Animation Speed Slider: Smooth adjustment from Slow (500ms/step) to Fast (10ms/step) to Instantaneous.
  * Step progress indicator: Real-time counter displaying `Step X of N`.
  * Integration with BFS, DFS, Dijkstra, and A* trace events.
* **Optional**:
  * Audible click/tone for step expansions (toggleable).

### 4. Dependencies
* Depends on **Phase 7** (Canvas editor and MVP UI) and **Phase 6** (C++ trace step generation in Visualization Mode).

### 5. Implementation Tasks
1. Create playback state management hook `client/src/hooks/usePlayback.ts`.
2. Define trace action handlers (`EXPAND_NODE`, `RELAX_EDGE`, `SET_FRONTIER`, `MARK_VISITED`).
3. Build `PlaybackControls` component with Play, Pause, Next, Prev, Reset, and Speed Slider.
4. Update `GraphCanvas` to apply dynamic SVG classes/styles based on current playback step state.
5. Implement backward-stepping logic by caching historical step states or replaying from step 0.
6. Connect "Run Algorithm" to automatically initialize playback mode upon receiving trace steps from API.
7. Test playback across all four algorithms (BFS, DFS, Dijkstra, A*).

### 6. Expected Deliverable
An animated, interactive visualization laboratory where users can watch algorithm search waves expand across the graph step-by-step or in real time.

### 7. Testing & Validation
* **Component & Interaction Tests**:
  * Clicking `Play` advances step counter automatically at designated speed interval.
  * Clicking `Pause` freezes current visual state without resetting.
  * Clicking `Next Step` advances exactly one state event.
  * Clicking `Previous Step` reverts to exact previous state.
  * Changing speed slider dynamically alters step interval without pausing.
  * Final step cleanly highlights the optimal route in luminous cyan/gold.

### 8. Completion Criteria
* [ ] Nodes and edges dynamically transition through distinct visual states during playback.
* [ ] Continuous playback runs smoothly without freezing the browser thread.
* [ ] Forward and backward stepping operates deterministically.
* [ ] Speed slider provides responsive control from slow exploration to instant completion.
* [ ] Final route animation clearly emphasizes the optimal path upon termination.

### 9. Recommended Git Checkpoint
```text
feat(client): implement step-by-step algorithm playback engine and visual state animator
```

---

## Phase 9 — Synthetic Graph Generation & Benchmark Dashboard

### 1. Objective
Implement deterministic synthetic graph generators in the C++ engine (Random, Sparse, Dense, Grid, Tree). Build the high-performance Benchmark Mode in C++ that processes large networks (up to 100,000+ nodes) without trace overhead. Implement the dedicated React Benchmark Dashboard with multi-run statistical summaries and performance bar charts.

### 2. Complexity
* **Rating**: `High`
* **Rationale**: Involves algorithmic graph generation with pseudo-random seed determinism, high-resolution multi-run timing isolation, memory profiling for large graphs, and responsive data visualization charts.

### 3. Scope
* **Must Have**:
  * **C++ Synthetic Graph Generators (`GraphGenerator.h/cpp`)**:
    * Random (Erdős–Rényi), Sparse ($E \approx 3V$), Dense ($E \approx 0.3 \cdot V^2$), 2D Grid, and Tree topologies.
    * Seed-based reproducibility: Supplying `seed: uint64_t` generates identical graphs.
  * **C++ Benchmark Harness (`Benchmark.h/cpp`)**:
    * Warm-up pass to prime CPU caches.
    * Multi-run execution ($N \ge 5$ iterations).
    * High-resolution timing isolating C++ kernel time from serialization/network.
    * Statistical metrics: Min time, Max time, Mean time, Standard Deviation.
    * Traversal metrics: Average nodes visited, average edges examined, average relaxations.
    * Cost verification: Proves whether all tested optimal algorithms found equal path costs.
  * **React Benchmark Dashboard (`/benchmark`)**:
    * Configuration form: Node count ($V$), edge density, topology selector, algorithm checkboxes, run count, seed input.
    * Presets: Small ($V=100$), Medium ($V=1,000$), Large ($V=10,000$), Very Large ($V=100,000$).
    * Performance comparison bar charts for Execution Time (ms) and Nodes Visited.
    * Structured comparative results table.
* **Optional**:
  * Benchmark export to CSV / Markdown format.

### 4. Dependencies
* Depends on **Phase 6** (C++ Benchmark Mode and REST endpoints) and **Phase 7** (Frontend routing and layout).

### 5. Implementation Tasks
1. Implement synthetic graph generators in `engine/include/benchmark/GraphGenerator.h` and `engine/src/benchmark/GraphGenerator.cpp`.
2. Implement multi-run benchmark orchestrator in `engine/include/benchmark/Benchmark.h`.
3. Add backend endpoint `POST /api/benchmark/run` in `server/src/controllers/benchmarkController.ts`.
4. Create frontend benchmark page in `client/src/pages/Benchmark.tsx`.
5. Build configuration form and size preset buttons (`Small`, `Medium`, `Large`, `Very Large`).
6. Build comparative bar chart components visualizing execution times and nodes visited.
7. Build benchmark data table displaying statistical metrics and path cost parity.
8. Validate 10,000-node and 100,000-node benchmarks execute within stable memory bounds.

### 6. Expected Deliverable
A dedicated, high-scale benchmarking dashboard capable of synthesizing deterministic graphs up to 100,000 nodes, executing multi-run comparative benchmarks, and rendering performance charts.

### 7. Testing & Validation
* **Unit Tests (`engine/tests/BenchmarkTest.cpp`)**:
  * Identical seeds generate identical graph node and edge sets.
  * Statistical calculations (min, max, mean, std-dev) match known numerical values.
  * Benchmark Mode omits trace events, consuming minimal memory.
* **Benchmark Stress Tests**:
  * 1,000 nodes, 5,000 edges: Completes under 50ms.
  * 10,000 nodes, 50,000 edges: Completes under 500ms without memory exhaustion.
  * Multi-run benchmark confirms A* and Dijkstra report identical minimal path costs.

### 8. Completion Criteria
* [ ] Deterministic graph generation produces reproducible topologies using seeds.
* [ ] Benchmark Mode handles large graphs ($V \ge 10,000$) with sub-second execution.
* [ ] Pure algorithm kernel time is strictly isolated from serialization and rendering time.
* [ ] Benchmark dashboard renders comparative charts and structured statistical tables.
* [ ] Path cost parity is verified and displayed between Dijkstra and A*.

### 9. Recommended Git Checkpoint
```text
feat: implement deterministic graph generators, benchmark harness, and benchmark dashboard
```

---

## Phase 10 — Portability, Hardening, Polish & Production Readiness

### 1. Objective
Complete state portability via JSON graph import and experiment export. Perform comprehensive automated regression testing, conduct an accessibility (a11y) audit, enforce responsive layouts across Desktop, Tablet, and Mobile, package production build artifacts (including a multi-stage Docker container), and author the master technical documentation.

### 2. Complexity
* **Rating**: `Medium`
* **Rationale**: Cross-cutting polish, schema validation, responsive CSS tuning, containerization, and writing exhaustive technical explanations.

### 3. Scope
* **Must Have**:
  * **JSON Portability**:
    * Graph Import: File upload with comprehensive schema validation, node ID checking, and clear error banners for invalid files.
    * Graph Export: Download current canvas topology as JSON matching import schema.
    * Experiment Export: Download complete analytical snapshot (topology + route + metrics + timestamp) as JSON.
  * **Responsive UI Layout**:
    * Desktop (>1024px): 3-column layout (Controls | Canvas | Results).
    * Tablet (768px - 1024px): 2-column layout.
    * Mobile (<768px): Vertical stacking with collapsible drawers; zero horizontal overflow.
  * **Accessibility (WCAG 2.1 AA)**:
    * Complete keyboard navigation (`Tab`, `Enter`, `Space`, `Arrows`).
    * High text and canvas element contrast.
    * Non-color visual cues (node badges `"S"`, `"D"`, line stroke styles).
  * **Regression & Edge-Case Hardening**:
    * Automated test suite executing all edge cases (empty graph, single node, disconnected graph, zero weights, negative weights, C++ process crash resilience).
  * **Production Packaging**:
    * Multi-stage Dockerfile compiling C++ binary and serving static React build via Express.
    * Production environment configuration.
  * **Documentation**:
    * Master `README.md` containing architecture diagrams, setup commands, complexity tables, and detailed justifications for the 7 key architectural design decisions.
* **Optional**:
  * Dark/Light mode theme toggle.

### 4. Dependencies
* Depends on **Phase 8** (Visualization engine) and **Phase 9** (Benchmark suite).

### 5. Implementation Tasks
1. Implement JSON graph import parser and validation in `client/src/utils/import.ts`.
2. Implement JSON graph and experiment export downloads in `client/src/utils/export.ts`.
3. Audit and refine CSS media queries for responsive tablet and mobile viewports.
4. Perform accessibility audit: verify keyboard tab-traversal and aria-labels.
5. Create end-to-end regression test suite verifying all required edge cases.
6. Create multi-stage `Dockerfile` in repository root.
7. Write comprehensive `README.md` explaining project purpose, build instructions, algorithm complexities, and the 7 documented architectural decisions.
8. Verify all 9 Final Acceptance Criteria from the project specification.

### 6. Expected Deliverable
A production-ready, fully tested, accessible, portable, and comprehensively documented PathForge platform running 100% database-free.

### 7. Testing & Validation
* **Regression Test Suite**:
  * Invalid JSON upload returns specific error banner detailing the invalid edge or missing ID.
  * Disconnected graph produces clean "no route exists" alert without crashing.
  * Process crash simulation returns structured HTTP 500 without crashing Express server.
* **A11y Audit**:
  * Lighthouse Accessibility score $\ge 95$.
  * Full workflow executable using keyboard only.
* **Production Build Verification**:
  ```bash
  docker build -t pathforge:latest .
  docker run -p 5000:5000 pathforge:latest
  # Verify localhost:5000 serves frontend and executes algorithms
  ```

### 8. Completion Criteria
* [ ] Valid JSON graphs can be imported and exported cleanly.
* [ ] Full experiment logs can be exported to JSON with all traversal statistics.
* [ ] UI functions cleanly on desktop, tablet, and mobile viewports without horizontal scrolling.
* [ ] All edge cases from Section 16 of the specification pass automated regression tests.
* [ ] Multi-stage Dockerfile builds and runs successfully in a standalone container.
* [ ] Master `README.md` comprehensively documents the system and defends all design decisions.
* [ ] **All Final Acceptance Criteria are verified and satisfied.**

### 9. Recommended Git Checkpoint
```text
chore: complete production hardening, a11y audit, JSON portability, and master README
```

---

## 4. Final Roadmap & Dependency Summary

| Phase | Phase Name | Primary Deliverable | Complexity | Dependencies | Milestone Achieved |
|:---:|---|---|:---:|:---:|---|
| **1** | **Foundation & Toolchain** | Buildable monorepo with CMake, Node, React, and GoogleTest harnesses | `Low` | — | Monorepo Scaffolding |
| **2** | **C++ Graph Core** | Adjacency list graph model with cascade deletion and unit tests | `Medium` | Phase 1 | C++ Graph Foundation |
| **3** | **Traversal Algorithms** | BFS and iterative DFS with predecessor tracking and metrics | `Medium` | Phase 2 | C++ Traversal Core |
| **4** | **Dijkstra's Algorithm** | Custom binary min-heap and optimal Dijkstra shortest path | `High` | Phase 2, 3 | Weighted Shortest Path |
| **5** | **A\* Search & Heuristics** | A* search kernel with Zero, Euclidean, and Manhattan heuristics | `High` | Phase 4 | Complete C++ DSA Engine |
| **6** | **IPC & Node.js API** | Stdin/stdout C++ JSON bridge and Express REST endpoints | `High` | Phase 5 | Backend API & Native IPC |
| **7** | **React Graph Editor** | Interactive canvas editor connecting to API for Dijkstra/A* runs | `High` | Phase 6 | **★ Functional MVP** |
| **8** | **Stepped Visualization** | Interactive playback engine with variable speed and state animator | `High` | Phase 6, 7 | Interactive Visualizer |
| **9** | **Benchmarking & Analytics**| Synthetic graph generators, multi-run harness, and charts | `High` | Phase 6, 7 | High-Scale Benchmark Suite |
| **10**| **Hardening & Release** | JSON portability, a11y, responsive design, Docker, and README | `Medium` | Phase 8, 9 | **Production Release** |
