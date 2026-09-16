# PathForge — Agent Instructions & Operating Rules

---

## 1. Mission & Architectural Identity

You are an expert AI software engineering agent working on **PathForge — Interactive Graph Pathfinding & Optimization Engine**.

PathForge is an interactive, web-based algorithmic laboratory designed to visualize and analyze graph data structures and pathfinding algorithms.

### 1.1 The Core Architectural Hierarchy

```text
React + TypeScript (Interactive Visualization & Canvas Editor)
        │ HTTP / JSON REST Requests
        ▼
Node.js + Express + TypeScript (API, Input Validation & Child Process Management)
        │ JSON via stdin / stdout
        ▼
C++ Algorithm Engine (Graph Core, Search Algorithms & Telemetry)
```

### 1.2 Primary Focus
The project is strictly **DSA-First (Data Structures & Algorithms-First)**. The C++ engine is the core intellectual component of the system. Everything in the web and API layers exists to make the C++ graph algorithms interactive, measurable, and visually understandable.

---

## 2. Absolute Non-Negotiable Invariants

These rules are permanent and must never be violated under any circumstances:

### 1. Database-Free Mandate
* **PathForge must not use a database.**
* **Never** install, configure, import, or introduce SQLite, PostgreSQL, MySQL, MongoDB, Redis, Firebase, Supabase, Prisma, TypeORM, or any persistent server-side store.
* All application, graph, and experiment state lives strictly in **runtime memory** (React state, Node.js process memory, C++ process memory).
* Persistence is handled exclusively through explicit client-side **JSON file import and export**.
* The project must be immediately runnable locally upon cloning with zero database setup, provisioning, or migration commands.

### 2. Native C++ DSA Engine Primacy
* **Never implement or duplicate the core graph pathfinding algorithms in JavaScript/TypeScript.**
* Breadth-First Search (BFS), Depth-First Search (DFS), Dijkstra's Algorithm, and A* Search must be implemented in **native C++ (C++17 or C++20)** within the `/engine` module.
* React is strictly a visualization and editing interface. Node.js is strictly an API and process manager.

### 3. First-Principles Implementation (No External Algorithm Libraries)
* Do not use third-party pathfinding libraries (such as Graphology, Cytoscape.js pathfinding plugins, Boost.Graph, or NetworkX).
* Implement the core data structures (Adjacency List, custom Binary Min-Heap / Priority Queue wrapper, predecessor mapping, and relaxation logic) from first principles in C++. Standard STL containers (`vector`, `unordered_map`, `queue`, `stack`) are permitted where appropriate.

### 4. Safe Inter-Process Communication (IPC)
* Node.js must spawn the compiled C++ executable using `child_process.spawn()`.
* **Never** use `child_process.exec()` with concatenated shell strings (strictly prevents shell injection vulnerabilities).
* Stream validated JSON payloads directly into the child process's `stdin` and capture results from `stdout`.
* Enforce process execution timeouts (e.g., 15 seconds) to kill non-terminating loops and return structured HTTP errors.

### 5. Configurable Trace Recording
The C++ engine and API support optional trace recording:
* **Visualization (Default)**: Generates granular step-by-step trace events (`steps: [...]`) for canvas playback animation.
* **Trace-Disabled Mode (`recordTrace: false`)**: Used during multi-algorithm comparison (`/api/compare`) to omit trace events (`steps: []`), returning path and performance metrics only. This avoids stream pipe saturation and maximizes response speed.

### 6. Strict Scope Boundaries
Do not add features that distract from the DSA laboratory purpose. Explicitly forbidden:
* User accounts, authentication, JWTs, sessions, or password hashing.
* Payment systems, monetization, or paywalls.
* Social features, chat, comments, or multi-user collaborative editing.
* Third-party real-world mapping APIs (Google Maps, Mapbox, Leaflet, OpenStreetMap). Nodes exist on an abstract 2D coordinate plane.
* Generic CRUD models or admin dashboards.

---

## 3. Phased Execution Protocol

When developing or modifying PathForge, you must adhere to the phased sequence defined in **[PathForge — Implementation Roadmap.md](file:///d:/PathForge/PathForge%20%E2%80%94%20Implementation%20Roadmap.md)**.

### 3.1 Sequential Phase Order

```text
Phase 1: Foundation & Toolchain (Monorepo scaffolding, CMake, Node, React)
   ↓
Phase 2: C++ Graph Core (Adjacency list, vertex indexing, cascade edge deletion)
   ↓
Phase 3: Traversal Algorithms (BFS, iterative stack DFS, path reconstruction)
   ↓
Phase 4: Dijkstra's Algorithm (Custom binary min-heap, non-negative relaxation)
   ↓
Phase 5: A* Search & Heuristics (Zero, Euclidean, Manhattan heuristics, optimality parity)
   ↓
Phase 6: Native IPC & Node.js API (C++ JsonBridge, Express REST routes, validation)
   ↓
Phase 7: Interactive React Graph Editor (Canvas, node/edge editing) [★ MVP MILESTONE]
   ↓
Phase 8: Stepped Visualization & Playback (Trace animator, playback controls)
   ↓
Phase 9: Multi-Algorithm Comparative Analysis (Side-by-side comparison, cost parity)
   ↓
Phase 10: Portability, Hardening & Release (JSON portability, a11y, Docker, README)
```

### 3.2 Autonomous Execution Rules for Agents

1. **One Phase at a Time**: Complete all tasks in the current phase before moving to the next. Do not build UI features before the underlying C++ algorithms and API routes exist and pass tests.
2. **Build and Test Every Phase**: Every phase must conclude with running tests or build scripts to verify the deliverable:
   * Engine: `ctest --test-dir build --output-on-failure`
   * Server: `npm run build` && `npm test`
   * Client: `npm run build`
3. **Satisfy Completion Criteria**: Verify all completion checkboxes in the roadmap before considering a phase finished.
4. **Follow the MVP Boundary**: The MVP is complete at the conclusion of **Phase 7**. Do not introduce complex animation controls or advanced comparative analysis until the Phase 7 MVP is verified.

---

## 4. Engineering & Code Standards

### 4.1 C++ Engineering Standards (`/engine`)
* **Standard**: C++17 or C++20.
* **Build System**: CMake ($\ge 3.16$).
* **Memory Management**: Use RAII. Avoid raw `new`/`delete`. Prefer standard containers, smart pointers, or flat indexed vectors. Zero memory leaks.
* **Graph Indexing**: Map string node IDs (`"A"`, `"node_1"`) to contiguous integers (`0, 1, ..., V-1`) via `std::unordered_map<std::string, int>` for $O(1)$ lookups and cache-friendly vector indexing.
* **Timing**: Measure algorithm kernel execution using `std::chrono::high_resolution_clock`. Strictly isolate algorithm search time from JSON serialization.
* **Unit Testing**: All C++ components must have unit tests written with **GoogleTest** in `engine/tests/`.

### 4.2 Node.js / Express Standards (`/server`)
* **Language**: TypeScript with strict mode enabled (`"strict": true`).
* **Validation**: Validate all incoming request bodies before touching the C++ engine. Reject malformed payloads with HTTP 400.
* **Error Handling**: Use structured JSON error envelopes:
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_NODE",
      "message": "Source node 'X' does not exist in graph."
    }
  }
  ```
* **Process Safety**: Always clean up child processes on timeouts or client aborts using `child.kill('SIGTERM')` followed by `child.kill('SIGKILL')`.

### 4.3 React / Frontend Standards (`/client`)
* **Framework**: React 18+ with TypeScript and Vite.
* **Styling**: Modern Vanilla CSS or clean CSS modules. Avoid heavy external CSS frameworks unless requested.
* **Graph Rendering**: Render the canvas using native **SVG** or HTML5 **Canvas**. Keep it lightweight, reactive, and responsive.
* **Accessibility (a11y)**:
  * Full keyboard navigation (`Tab`, `Enter`, `Space`, `Arrow` keys).
  * High contrast matching WCAG 2.1 AA.
  * Provide non-color visual cues (labels, badges `"S"`, `"D"`, line weight, dash styles) so states are discernible without relying solely on color.
* **Responsive Layout**:
  * Desktop (>1024px): 3-column layout (Controls | Canvas | Results).
  * Tablet (768px - 1024px): 2-column layout.
  * Mobile (<768px): Vertically stacked layout; zero horizontal overflow.

---

## 5. Testing & Verification Principles

### 5.1 Correctness Before Performance
Follow the mandatory development order:
$$\text{Input Validation} \longrightarrow \text{Algorithmic Correctness} \longrightarrow \text{Automated Unit Tests} \longrightarrow \text{Integration Tests} \longrightarrow \text{Comparative Verification}$$

Do not optimize code before proving correctness through automated tests.

### 5.2 Mandatory Edge-Case Verification
Every implementation must handle and test these critical edge cases:
1. **Empty Graph ($V = 0$)**: Reject with structured `EMPTY_GRAPH` error.
2. **Single Node ($V = 1$)**: Return path `[A]` with cost `0.0`.
3. **Source Equals Destination ($S = D$)**: Return path `[S]` with cost `0.0`.
4. **Disconnected Graph**: Return `path: []`, `cost: null`, and a friendly `"No route exists"` message.
5. **Zero-Weight Edges ($w = 0$)**: Allow and process without infinite loops.
6. **Negative-Weight Edges ($w < 0$)**: Reject for Dijkstra and A* with `NEGATIVE_EDGE_WEIGHT`.
7. **Multiple Shortest Paths**: Return a valid optimal path deterministically.
8. **Missing Coordinates for A\***: Reject Euclidean/Manhattan requests on non-coordinate graphs with `MISSING_NODE_COORDINATES`.
9. **C++ Crash / Failure**: Node.js catches abnormal exit, logs stderr, and returns HTTP 500 without crashing the server.

### 5.3 Regression Testing Workflow
Whenever a bug is discovered:
$$\text{Bug Discovered} \longrightarrow \text{Create Failing Test} \longrightarrow \text{Fix Implementation} \longrightarrow \text{Verify Test Passes} \longrightarrow \text{Retain Test Permanently}$$

---

## 6. Authoritative Reference Documents

When you need detailed schemas, formulas, or implementation context, consult the two master specification documents in the repository:

1. **[PathForge — Consolidated Project Specification.md](file:///d:/PathForge/PathForge%20%E2%80%94%20Consolidated%20Project%20Specification.md)**
   * The single authoritative technical and product specification.
   * Contains complete data models, mathematical formulas, Big-O complexities, API endpoint contracts, JSON schemas, UI layout designs, and acceptance criteria.

2. **[PathForge — Implementation Roadmap.md](file:///d:/PathForge/PathForge%20%E2%80%94%20Implementation%20Roadmap.md)**
   * The sequential, 10-phase execution plan.
   * Contains phase objectives, scopes, actionable tasks, expected deliverables, testing checklists, and completion criteria.

---

## 7. Pre-Completion Checklist for Any Task

Before completing a task, confirm:
* [ ] Does the solution strictly adhere to the database-free mandate?
* [ ] Are all pathfinding algorithms executed in native C++?
* [ ] Does the C++ code compile cleanly with zero warnings (`-Wall -Wextra`)?
* [ ] Do all unit and integration tests pass?
* [ ] Are error responses properly structured with error codes and descriptive messages?
* [ ] Is the code thoroughly documented with comments explaining *why* non-obvious logic exists?
* [ ] Are all references and links consistent with `PathForge` naming?
