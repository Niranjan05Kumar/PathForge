# PathForge
### Interactive Graph Pathfinding & Optimization Engine

---

## 1. Project Overview

**PathForge** is an interactive, web-based algorithmic laboratory and route optimization platform engineered to design, visualize, analyze, and benchmark graph data structures and pathfinding algorithms.

The project is strictly **DSA-first (Data Structures & Algorithms-first)**. It is not a conventional full-stack CRUD application. The primary intellectual and computational core resides in a high-performance **C++ engine** that implements graph representations, priority queues, and search algorithms from first principles. A **Node.js + Express + TypeScript** service provides an API integration and process management layer, while a modern **React + TypeScript + Vite** frontend provides an interactive graph canvas, stepped algorithm visualizer, and benchmarking dashboard.

### 1.1 Architectural Hierarchy

```text
React + TypeScript (Interactive Visualization & Controls)
        │ HTTP / JSON
        ▼
Node.js + Express + TypeScript (API, Validation & Process Management)
        │ JSON via stdin / stdout
        ▼
C++ Algorithm Engine (Graph Core, Search Algorithms & Benchmarking)
```

The C++ engine is the core intellectual component. React functions strictly as the visual interface and presentation layer. Node.js/Express acts as the integration and orchestration bridge. The frontend must **never** duplicate or execute core pathfinding algorithms in JavaScript.

### 1.2 Storage Constraint: Database-Free

> **PathForge must not use a database.**

The project operates under a strict database-free architectural mandate:
* No MongoDB, PostgreSQL, MySQL, SQLite, Redis, Firebase, Supabase, or persistent server-side database of any kind may be introduced.
* No ORMs, database drivers, migration files, or user account/authentication tables are permitted.
* All application and graph state resides purely in runtime memory (React state, Node.js process memory, and C++ engine memory).
* Persistence is supported exclusively through explicit client-side **JSON file import and export**.
* The application must be instantly runnable locally upon cloning, with zero database setup, provisioning, or schema migrations.

---

## 2. Goals & Scope

PathForge provides an end-to-end sandbox enabling developers, students, and engineers to explore the mechanics and empirical performance of classical graph algorithms.

### 2.1 Primary User Capabilities

1. **Interactive Graph Construction**: Create, position, modify, and delete nodes and edges on a 2D coordinate canvas.
2. **Graph Property Configuration**: Toggle between directed and undirected topologies, weighted and unweighted edges, and configure constraints for self-loops and duplicate edges.
3. **Node Selection**: Select distinct source and destination nodes visually or through search controls.
4. **Algorithm Selection & Tuning**: Choose between Breadth-First Search (BFS), Depth-First Search (DFS), Dijkstra's Algorithm, and A* Search with selectable heuristics.
5. **Continuous & Stepped Visualization**: Execute algorithms with continuous animated playback or step through execution events operation by operation.
6. **Detailed Metrics Inspection**: Inspect final reconstructed routes, total path costs, node expansion counts, edge relaxation counts, and sub-millisecond execution times.
7. **Side-by-Side Algorithm Comparison**: Execute multiple algorithms concurrently or sequentially on the exact same graph instance and verify path cost parity.
8. **Synthetic Graph Generation**: Generate deterministic synthetic graphs (Random, Sparse, Dense, Grid, Tree) parameterized by node counts and pseudo-random seeds.
9. **High-Scale Benchmarking**: Benchmark algorithms across small to very large graphs (100 to 100,000+ nodes) with multi-run statistical aggregation.
10. **State Portability**: Import and export custom graph topologies and full experimental results via structured JSON.
11. **Runtime Reset**: Reset graphs, visual traces, and benchmark caches cleanly without residual persistence.

### 2.2 Pedagogical & Interview Value

The implementation must serve as an exemplar of rigorous software engineering and computer science fundamentals suitable for technical interviews:
* Concrete demonstration of graph representations (Adjacency Lists vs. Matrices).
* First-principles implementation of a Min-Priority Queue / Binary Heap.
* Clear distinction between unweighted shortest paths (BFS) and weighted optimal routing (Dijkstra, A*).
* Empirical verification of heuristic admissibility and consistency in A*.
* Predecessor map management and linear-time path reconstruction.
* Theoretical Big-O time and space complexity validated against empirical benchmark curves.
* Robust inter-process communication (IPC) between high-level web runtimes and native C++.
* Comprehensive automated testing using GoogleTest.

---

## 3. Technology Stack

PathForge is built using a decoupled, multi-tier architecture with clean separation of concerns:

| Layer | Technology | Primary Responsibilities |
|---|---|---|
| **Frontend** | React, TypeScript, Vite, HTML5, CSS | Interactive SVG/Canvas rendering, graph editing UI, step-by-step playback controls, visual state styling, benchmark charts, JSON file download/upload. |
| **Backend API** | Node.js, Express, TypeScript | REST API exposure, JSON schema request validation, C++ child process spawning and lifecycle management, stdin/stdout stream serialization, structured error handling, logging. |
| **Algorithm Engine** | C++ (C++17 / C++20), CMake | In-memory graph representation, custom data structures (Min-Heap), BFS, DFS, Dijkstra, A*, heuristic functions, path reconstruction, synthetic graph generation, high-resolution execution timing. |
| **Testing** | GoogleTest (C++), Vitest / Supertest (Node.js) | Unit testing of core C++ data structures and algorithms, API integration testing, frontend interaction testing, regression test verification. |
| **Persistence** | None (In-Memory + JSON Files) | Transient runtime state; explicit JSON import/export for graphs and experiment logs. |

---

## 4. System Architecture

```text
┌──────────────────────────────────────────────────────────────────┐
│                       React + TypeScript                         │
│                                                                  │
│   Graph Editor  │  Playback Controls  │  Visualization Engine    │
│   Results Panel │  Comparison Table   │  Benchmark Dashboard     │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ HTTP / JSON
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                  Node.js + Express + TypeScript                  │
│                                                                  │
│   REST Endpoints       │  Input Validation & Schema Checking     │
│   C++ Process Manager  │  Stream Buffering & Error Formatting    │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ JSON via stdin / stdout
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                       C++ Algorithm Engine                       │
│                                                                  │
│   Graph Adjacency List  │  Min-Priority Queue  │  Path Reconstructor│
│   BFS & DFS Kernels     │  Dijkstra & A*       │  Graph Generators  │
│   Execution Tracer      │  High-Res Timer      │  JSON Bridge       │
└──────────────────────────────────────────────────────────────────┘
```

### 4.1 Tier Responsibilities & Boundaries

#### C++ Engine
* Owns all graph data structures, adjacency lists, and vertex indexing.
* Owns all pathfinding implementations, relaxation loops, and priority queue operations.
* Reconstructs paths from predecessor maps and computes exact path costs.
* Generates granular execution trace steps in Visualization Mode.
* Generates aggregate timing and traversal metrics in Benchmark Mode.
* Generates reproducible synthetic graphs based on seeds.
* Measures pure algorithm kernel execution using high-resolution hardware timers (`std::chrono::high_resolution_clock`).

#### Node.js Server
* Exposes clean REST endpoints for graph validation, generation, pathfinding execution, and benchmarking.
* Validates incoming request payloads, ensuring structural validity, data-type safety, and parameter bounds.
* Spawns the compiled C++ engine executable as a child process via `child_process.spawn()`.
* Streams validated JSON payloads into C++ standard input (`stdin`) and buffers responses from standard output (`stdout`).
* Enforces execution timeouts to prevent runaway processes or resource exhaustion.
* Captures standard error (`stderr`) and maps C++ failures to structured HTTP error responses.
* Implements no pathfinding logic in JavaScript.

#### React Client
* Renders the interactive 2D graph canvas using SVG or Canvas.
* Captures user input for creating, moving, and connecting nodes and edges.
* Manages visualization playback state (running, paused, stepping, speed adjustment).
* Applies dynamic CSS classes and SVG attributes to visualize node and edge states (frontier, visited, current, path).
* Displays formatted route summaries, optimization metrics, and comparative data tables.
* Renders comparative bar charts for benchmark runs.
* Facilitates browser-driven JSON import and export via Blob/File APIs.
* Implements no pathfinding logic in JavaScript.

### 4.2 C++ ↔ Node.js Inter-Process Communication

Communication between Node.js and the native C++ engine uses standard streams:
1. Node.js initiates an execution request by spawning the compiled engine binary:
   ```bash
   ./pathforge-engine
   ```
2. Node.js writes the stringified JSON request into the child process's `stdin` pipe and closes the write stream (`stdin.end()`).
3. The C++ engine parses JSON from `std::cin`, executes the designated command, writes the stringified JSON response to `std::cout`, and terminates with exit code `0`.
4. Node.js buffers `stdout`, parses the resulting JSON, and returns the response to the frontend client.
5. If the C++ process terminates with a non-zero exit code or writes to `stderr`, Node.js catches the fault, logs the diagnostic message, and responds with a structured error payload.
6. The C++ engine must also support standalone CLI execution for debugging:
   ```bash
   ./pathforge-engine input.json
   ```

---

## 5. Core Graph Model

### 5.1 Conceptual Data Model

A graph instance $G = (V, E)$ consists of a set of vertices (nodes) and edges:

```text
Graph
├── configuration
│   ├── directed: boolean
│   ├── weighted: boolean
│   ├── allowDuplicateEdges: boolean
│   └── allowSelfLoops: boolean
├── nodes: Node[]
└── edges: Edge[]
```

#### Node Structure
Each node contains visual and topological properties:
* `id` (`string`): Unique identifier (e.g., `"A"`, `"node_1"`, `"42"`).
* `label` (`string`): Human-readable label displayed on the canvas (defaults to `id`).
* `x` (`number`): Abstract horizontal coordinate on the canvas (used for layout and A* heuristics).
* `y` (`number`): Abstract vertical coordinate on the canvas (used for layout and A* heuristics).

#### Edge Structure
Each edge connects two nodes with an associated cost:
* `id` (`string`, optional): Unique edge identifier.
* `source` (`string`): Identifier of the source node.
* `target` (`string`): Identifier of the target node.
* `weight` (`number`): Cost value $\ge 0$ (defaults to `1.0` in unweighted mode).

### 5.2 Internal C++ Representation

For internal processing, the C++ engine uses an **Adjacency List** representation optimized for sparse graph traversals and memory locality:

```cpp
struct Edge {
    int target;
    double weight;
};

class Graph {
private:
    bool directed;
    bool weighted;
    std::unordered_map<std::string, int> nodeToIndex;
    std::vector<std::string> indexToNode;
    std::vector<std::pair<double, double>> nodeCoordinates;
    std::vector<std::vector<Edge>> adjacencyList;
    
public:
    int addNode(const std::string& id, double x = 0.0, double y = 0.0);
    void addEdge(const std::string& source, const std::string& target, double weight = 1.0);
    const std::vector<Edge>& getNeighbors(int nodeIndex) const;
    size_t getVertexCount() const;
    size_t getEdgeCount() const;
};
```

#### Structural Efficiency
* Fast lookups: String node IDs are mapped to contiguous 0-indexed integers (`int`) via `std::unordered_map<std::string, int>`.
* Algorithmic arrays: Distance arrays, predecessor maps, and visited sets use fast flat vectors (`std::vector<double>`, `std::vector<int>`, `std::vector<bool>`) indexed directly by integer vertex IDs.
* Space efficiency: An adjacency list requires $O(V + E)$ space, preventing the $O(V^2)$ memory overhead of adjacency matrices on large sparse graphs ($V = 100,000, E = 500,000$).
* Directed vs. Undirected: In directed mode, edge $(u, v)$ is stored only in $u$'s list. In undirected mode, $(u, v)$ is inserted into $u$'s list and $(v, u)$ is inserted into $v$'s list.

---

## 6. Graph Creation & Editing

The frontend provides an interactive graph editor allowing users to construct arbitrary network topologies directly on the canvas.

### 6.1 Supported User Actions

* **Add Node**:
  * User activates the "Add Node" tool and clicks on the canvas.
  * A node is created at canvas coordinates $(x, y)$ with an auto-incremented alphanumeric identifier (e.g., `A`, `B`, `C`...).
  * Duplicate node IDs are rejected.
* **Move Node**:
  * User clicks and drags any node across the 2D canvas plane.
  * Node coordinates $(x, y)$ update in real time. Connected edges adjust their endpoints dynamically.
  * Coordinate changes immediately update the heuristic distance calculations for A*.
* **Delete Node**:
  * User selects a node and presses `Delete` / `Backspace` or clicks the trash icon.
  * The node is removed.
  * **Cascade Deletion**: All inbound and outbound edges connected to the deleted node are automatically removed.
  * If the deleted node was selected as the source or destination, the selection is cleared.
* **Add Edge**:
  * User selects the "Add Edge" tool, clicks the source node, and drags/clicks the target node.
  * If the graph is weighted, a modal or inline prompt inputs the edge weight (default `1.0`).
  * If the graph is directed, an arrowhead indicates orientation ($A \to B$). If undirected, a bidirectional link is rendered ($A \leftrightarrow B$).
  * Self-loops ($A \to A$) and parallel/duplicate edges are rejected by default.
* **Delete Edge**:
  * User selects an edge and clicks the delete action, removing the link from the topology.
* **Edit Edge Weight**:
  * User double-clicks an edge or selects it to modify its numeric weight. Weights $< 0$ are blocked.
* **Select Source & Destination**:
  * Dedicated controls allow the user to designate one node as the **source node** (marked with a distinctive green accent and badge) and one node as the **destination node** (marked with a distinctive red/amber accent and badge).
* **Clear Canvas**:
  * Resets the graph editor to an empty canvas upon confirmation.

---

## 7. Graph Import, Export & Generation

### 7.1 JSON Import

Users can upload graph topologies formatted in standard JSON.

#### Schema Definition
```json
{
  "directed": false,
  "weighted": true,
  "allowDuplicateEdges": false,
  "allowSelfLoops": false,
  "nodes": [
    { "id": "A", "label": "Start Node", "x": 100, "y": 150 },
    { "id": "B", "label": "Junction B", "x": 300, "y": 120 },
    { "id": "C", "label": "Target Node", "x": 450, "y": 280 }
  ],
  "edges": [
    { "source": "A", "target": "B", "weight": 4.5 },
    { "source": "B", "target": "C", "weight": 2.1 },
    { "source": "A", "target": "C", "weight": 8.0 }
  ]
}
```

#### Import Validation Rules
Before loading an uploaded JSON file, the system enforces:
1. Syntax validity: File must parse as valid JSON.
2. Structure: Root object must contain `nodes` and `edges` arrays.
3. Node Integrity: Every node must contain a non-empty string `id`. Duplicate `id` values are rejected.
4. Edge Integrity: Every edge must reference existing `source` and `target` node IDs.
5. Weight Integrity: For weighted graphs, `weight` must be a non-negative number ($w \ge 0$).
6. Configuration Rules: If `allowSelfLoops` is false, reject edges where `source == target`. If `allowDuplicateEdges` is false, reject duplicate edges between the same endpoint pair.

### 7.2 JSON Export

The application supports two client-side export options generating downloadable JSON files directly via browser Blobs:

#### 1. Export Graph Topology
Exports the current graph configuration, nodes, and edges formatted to match the standard import schema.

#### 2. Export Experiment / Benchmark Log
Exports a complete analytical snapshot containing:
* Graph configuration and topology summary (node count, edge count, directed, weighted).
* Selected source and destination node IDs.
* Algorithm executed (e.g., Dijkstra, A*).
* Selected heuristic (if A*).
* Reconstructed path array (`["A", "B", "C"]`).
* Total path cost.
* Traversal metrics (`nodesVisited`, `edgesExamined`, `relaxations`).
* Precise execution time in milliseconds.
* ISO timestamp of the experiment.

### 7.3 Synthetic Graph Generation

The C++ engine includes built-in graph generators to construct synthetic benchmarks deterministically:

| Topology | Description | Typical Connectivity / Parameters |
|---|---|---|
| **Random (Erdős–Rényi)** | Uniformly distributed random node placement with random edge assignment. | Node count $V$, Edge count $E$. |
| **Sparse Graph** | Low-degree network modeling real-world road maps or transport networks. | $E \approx 2V$ to $4V$. |
| **Dense Graph** | Highly interconnected network modeling dense telecommunication fabrics. | $E \approx 0.2 \cdot \frac{V(V-1)}{2}$ to $0.5 \cdot \frac{V(V-1)}{2}$. |
| **Grid Graph** | 2D mesh/lattice network with 4-way orthogonal connectivity. | Natural integer grid coordinates $(x, y)$. |
| **Tree / DAG** | Connected acyclic structure or directed acyclic graph. | Exactly $V - 1$ edges for trees. |

#### Generation Parameters
* `nodes` (`number`): Target vertex count $V$.
* `edges` (`number`) or `density` (`number`): Target edge density or count.
* `topology` (`string`): `"random"` | `"sparse"` | `"dense"` | `"grid"` | `"tree"`.
* `directed` (`boolean`): Whether generated edges are directed.
* `weighted` (`boolean`): Whether edges receive random weights within $[w_{min}, w_{max}]$.
* `seed` (`number`, optional): Unsigned 64-bit integer seed for pseudo-random number generators (`std::mt19937_64`). Supplying the same seed guarantees **100% reproducible graph generation** across test runs.

---

## 8. Algorithms & Data Structures

PathForge implements four fundamental pathfinding algorithms in C++:

### 8.1 Breadth-First Search (BFS)

* **Purpose**: Computes unweighted shortest paths (minimum number of edge hops) and demonstrates level-order graph exploration.
* **Data Structures**:
  * Standard FIFO queue (`std::queue<int>`).
  * Visited set / boolean vector (`std::vector<bool>`).
  * Predecessor map (`std::vector<int>`).
* **Execution Flow**:
  1. Enqueue source node; mark visited; set `parent[source] = -1`.
  2. While queue is not empty:
     a. Dequeue front node $u$.
     b. If $u == \text{destination}$, terminate early.
     c. For each outgoing edge $(u, v)$:
        - Increment `edgesExamined`.
        - If $v$ is unvisited: mark visited, set `parent[v] = u`, enqueue $v$.
  3. Reconstruct path from destination to source via `parent[]`.
* **Complexity**: Time $O(V + E)$, Space $O(V)$.

### 8.2 Depth-First Search (DFS)

* **Purpose**: Graph traversal, connectivity analysis, and cycle exploration.
* **Crucial Design Rule**: **DFS does not guarantee shortest paths on general or weighted graphs.** The UI and documentation must clearly state this limitation.
* **Data Structures**:
  * Explicit iteration stack (`std::stack<int>`) to prevent call-stack overflow on deep graphs ($V > 10,000$).
  * Visited boolean vector (`std::vector<bool>`).
  * Predecessor map (`std::vector<int>`).
* **Complexity**: Time $O(V + E)$, Space $O(V)$.

### 8.3 Dijkstra's Shortest Path Algorithm

* **Purpose**: Optimal shortest-path routing on graphs with non-negative edge weights.
* **Mathematical Invariant**: Provably finds the minimum-weight path from source to all reachable vertices when all edge weights $w(u, v) \ge 0$.
* **Data Structures**:
  * Distance vector (`std::vector<double>`): Initialized to $\infty$, with `dist[source] = 0`.
  * Predecessor vector (`std::vector<int>`): Stores optimal parent pointers.
  * Closed set / finalized vector (`std::vector<bool>`): Tracks settled vertices.
  * **Custom Min-Priority Queue / Binary Heap**: Stores `(distance, nodeIndex)` pairs ordered by minimum distance.
* **Detailed Execution Steps**:
  1. Validate non-negative edge weights; if any $w < 0$, abort with `NEGATIVE_EDGE_WEIGHT`.
  2. Initialize `dist[v] = infinity` for all $v \in V$, `dist[source] = 0.0`.
  3. Insert `(0.0, source)` into min-heap.
  4. While min-heap is not empty:
     a. Extract minimum-distance element `(d, u)`.
     b. If `closedSet[u] == true`, discard (stale entry).
     c. Mark `closedSet[u] = true`, increment `nodesVisited`.
     d. If $u == \text{destination}$, terminate search (destination settled).
     e. For each outgoing edge $(u, v)$ with weight $w$:
        - Increment `edgesExamined`.
        - If `closedSet[v] == true`, continue.
        - Relaxation check: If `dist[u] + w < dist[v]`:
          - `dist[v] = dist[u] + w`.
          - `parent[v] = u`.
          - Insert `(dist[v], v)` into min-heap.
          - Increment `relaxations`.
  5. Reconstruct path from destination to source via `parent[]`.
* **Tracked Metrics**: `nodesVisited`, `edgesExamined`, `relaxations`, `executionTimeMs`, `pathCost`.
* **Complexity**: Time $O((V + E) \log V)$ with adjacency list and binary heap. Space $O(V)$.

### 8.4 A* Search Algorithm

* **Purpose**: Goal-directed heuristic pathfinding optimizing node expansion using domain knowledge.
* **Evaluation Function**:
  $$f(n) = g(n) + h(n)$$
  * $g(n)$: Exact known path cost from source to current node $n$.
  * $h(n)$: Heuristic estimate of remaining cost from $n$ to destination.
  * $f(n)$: Estimated total path cost through $n$.
* **Admissibility & Consistency**:
  * An admissible heuristic never overestimates the true remaining cost ($h(n) \le h^*(n)$).
  * A consistent (monotone) heuristic satisfies $h(u) \le w(u, v) + h(v)$, guaranteeing that the first time a node is expanded, its $g(n)$ is optimal.
* **Supported Heuristics**:
  1. **Zero Heuristic** ($h(n) = 0$): Admissible for all graphs. Causes A* to behave identically to Dijkstra in exploration order and frontier management.
  2. **Euclidean Distance**:
     $$h(n) = \sqrt{(x_n - x_{dest})^2 + (y_n - y_{dest})^2}$$
     Admissible on 2D planes where edge weights represent geometric Euclidean distance.
  3. **Manhattan Distance**:
     $$h(n) = |x_n - x_{dest}| + |y_n - y_{dest}|$$
     Admissible for 4-directional grid graphs where movement is restricted to orthogonal axes.
* **Detailed Execution Steps**:
  1. Validate non-negative edge weights; if coordinate heuristic is selected, verify all nodes have valid $(x, y)$ coordinates.
  2. Initialize `gScore[v] = infinity`, `fScore[v] = infinity` for all $v \in V$.
  3. `gScore[source] = 0.0`, `fScore[source] = h(source)`.
  4. Insert `(fScore[source], source)` into Open Set (min-heap).
  5. While Open Set is not empty:
     a. Extract element with minimum $fScore$: `(f, u)`.
     b. If `closedSet[u] == true`, discard stale entry.
     c. Mark `closedSet[u] = true`, increment `nodesVisited`.
     d. If $u == \text{destination}$, terminate search (destination reached).
     e. For each outgoing edge $(u, v)$ with weight $w$:
        - Increment `edgesExamined`.
        - If `closedSet[v] == true`, continue.
        - Tentative $gScore$: `tentative_g = gScore[u] + w`.
        - If `tentative_g < gScore[v]`:
          - `parent[v] = u`.
          - `gScore[v] = tentative_g`.
          - Calculate $h(v)$ (increment `heuristicCalls`).
          - `fScore[v] = tentative_g + h(v)`.
          - Insert `(fScore[v], v)` into Open Set.
          - Increment `relaxations`.
  6. Reconstruct path from destination to source via `parent[]`.
* **Tracked Metrics**: `nodesVisited`, `edgesExamined`, `relaxations`, `heuristicCalls`, `executionTimeMs`, `pathCost`.
* **Complexity**: Time $O((V + E) \log V)$ in worst case; in practice substantially fewer node expansions ($O(b^d)$ with a lower effective branching factor $b$) depending on heuristic accuracy. Space $O(V)$.

---

## 9. Path Reconstruction

All shortest-path algorithms maintain a predecessor array (`parent[v]`) throughout execution.

### 9.1 Reconstruction Logic

```cpp
std::vector<std::string> reconstructPath(
    int sourceIndex,
    int destIndex,
    const std::vector<int>& parent,
    const std::vector<std::string>& indexToNode
) {
    std::vector<std::string> path;
    if (sourceIndex == destIndex) {
        path.push_back(indexToNode[sourceIndex]);
        return path;
    }
    if (parent[destIndex] == -1) {
        return path; // No route exists
    }
    
    int curr = destIndex;
    while (curr != -1) {
        path.push_back(indexToNode[curr]);
        if (curr == sourceIndex) break;
        curr = parent[curr];
    }
    std::reverse(path.begin(), path.end());
    return path;
}
```

### 9.2 Path Cost & Special Cases
* **Cost Verification**: Path cost is computed by summing the weights of edges along the reconstructed sequence $\sum_{i=1}^{k-1} w(v_i, v_{i+1})$ and cross-verified against `dist[destination]` or `gScore[destination]`.
* **Single Node / Source Equals Destination**: If `source == destination`, the engine returns a path containing only `[source]` with total cost `0.0`.
* **Unreachable Destination**: If no route connects source and destination, the engine returns `path: []`, `cost: null`, and a structured `NO_PATH_FOUND` message.
* **Deterministic Tie-Breaking**: When multiple paths share identical minimal cost, priority queues break ties consistently (e.g., by vertex index or ID), ensuring deterministic, repeatable results across runs.

---

## 10. Algorithm Execution & Visualization Modes

The C++ engine provides two distinct execution modes to balance rich visual education with high-performance benchmarking:

### 10.1 Visualization Mode

* **Target Graph Size**: Small to medium graphs ($V \le 2,000$, $E \le 10,000$).
* **Primary Objective**: Deliver step-by-step visual animation for interactive learning.
* **Payload Characteristics**: Returns final result metadata alongside a granular `steps` array.
* **Trace Step Schema**:
  ```json
  {
    "step": 14,
    "currentNode": "C",
    "currentEdge": { "source": "A", "target": "C" },
    "action": "RELAX_EDGE",
    "frontier": ["B", "D", "E"],
    "visited": ["A", "C"],
    "updatedDistances": {
      "D": 7.5,
      "E": 9.0
    }
  }
  ```
* **Frontend Handling**: The React visualizer receives the precomputed event trace and animates the transitions using playback timers. The frontend does not reverse-engineer algorithm state.

### 10.2 Benchmark Mode

* **Target Graph Size**: Medium to very large graphs ($V$ from 1,000 up to 100,000+).
* **Primary Objective**: Measure pure algorithmic performance and scalability without memory or serialization bottlenecks.
* **Payload Characteristics**:
  * Returns **aggregate metrics only** (`pathCost`, `nodesVisited`, `edgesExamined`, `relaxations`, `executionTimeMs`).
  * **Omits the `steps` array completely** (`steps: []`).
  * Avoids generating millions of trace JSON objects that would saturate memory, choke standard pipes, and crash browser rendering threads.

---

## 11. User Interface & Canvas Workspace

The frontend consists of two primary screens: the **Workspace** and the **Benchmark Dashboard**.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Header: PathForge Brand | [ Workspace ] [ Benchmark ] | Reset | Preset Demo │
├─────────────────┬───────────────────────────────────────────┬───────────────┤
│ Controls Panel  │ Graph Canvas                              │ Results Panel │
│                 │                                           │               │
│ • Graph Type    │  (S) [Node A] ─────── [Node B]            │ • Route:      │
│   [Directed]    │          \                 /              │   A → C → D   │
│   [Weighted]    │           \               /               │ • Cost: 14.2  │
│                 │            [Node C] ───── (D) [Node D]    │ • Visited: 42 │
│ • Source: [A]   │                                           │ • Edges: 89   │
│ • Dest:   [D]   │                                           │ • Time: 0.3ms │
│ • Algo: [A*   ] │                                           │               │
│ • Heur: [Eucl.] │                                           │               │
├─────────────────┴───────────────────────────────────────────┴───────────────┤
│ Playback Controls: [◀ Prev] [▶ Run] [⏸ Pause] [Next ▶] [Reset]  Speed: ──●──│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.1 Main Workspace (`/workspace`)

#### 1. Header Bar
* Application title and identity: **PathForge — Interactive Graph Pathfinding & Optimization Engine**.
* Navigation tabs: **Workspace** and **Benchmark**.
* Quick graph load presets (e.g., Simple Weighted, Grid Maze, Dense Network, Disconnected Graph).
* Global canvas reset button.

#### 2. Left Sidebar (Controls Panel)
* **Graph Settings**: Toggles for Directed vs. Undirected, Weighted vs. Unweighted, Allow Duplicate Edges, Allow Self-Loops.
* **Node & Edge Operations**: Add Node, Add Edge, Delete Selected, Clear All.
* **Algorithm Selection**: Dropdown to select BFS, DFS, Dijkstra, or A*.
* **A* Heuristic Selector**: Dropdown for Zero Heuristic, Euclidean Distance, or Manhattan Distance (disabled when other algorithms are selected).
* **Source & Destination Selectors**: Dropdowns and visual pickers for start and target nodes.
* **Action Buttons**: Primary "Run Algorithm" button, "Compare Algorithms" button, "Reset State" button.
* **Import / Export**: "Import Graph JSON", "Export Graph JSON", "Export Experiment JSON".

#### 3. Center Canvas (Interactive Graph Workspace)
* Built using interactive SVG or Canvas with pan and zoom capabilities.
* Interactive drag-and-drop node repositioning with coordinate updates.
* Clearly distinguishable visual states using accessible colors, stroke styles, and badges:

| Element | Visual State | Canvas Styling & Indicators |
|---|---|---|
| **Node** | Default | Neutral fill, subtle dark border. |
| **Node** | Source | Emerald green fill, thick border, distinct `"S"` badge. |
| **Node** | Destination | Amber/coral fill, thick border, distinct `"D"` badge. |
| **Node** | Frontier / Open Set | Soft blue/purple accent, glowing border. |
| **Node** | Currently Processing | High-contrast yellow highlight with active pulse animation. |
| **Node** | Visited / Closed Set | Muted slate/gray fill, dashed border. |
| **Node** | Final Optimal Path | Luminous cyan/gold fill, solid border, highlighted label. |
| **Edge** | Default | Thin neutral gray stroke; arrowhead for directed edges. |
| **Edge** | Being Examined | Colored stroke highlight matching current search wave. |
| **Edge** | Final Optimal Path | Thick, luminous gold/cyan stroke with directional indicator. |

#### 4. Right Sidebar (Results Panel)
* Display of executed algorithm and heuristic configuration.
* Formatted optimal route sequence (e.g., `A → C → F → Z`).
* Total path cost formatted to two decimal places.
* Traversal metrics cards:
  * Nodes Visited
  * Edges Examined
  * Edge Relaxations
  * Execution Time (ms)
* "No Path Found" prominent alert banner when target is unreachable.

#### 5. Bottom Bar (Playback & Step Controls)
* Playback buttons: `Run`, `Pause`, `Resume`, `Next Step`, `Previous Step`, `Reset`.
* Speed Slider: Adjustable animation speed from Slow (500ms per step) to Fast (10ms per step) to Instantaneous.
* Step counter and progress bar: Displays `Step X of N`.

### 11.2 Benchmark Dashboard (`/benchmark`)

* **Configuration Controls**:
  * Node count input ($V$) and Edge count / Density input ($E$).
  * Topology selector: Random, Sparse, Dense, Grid, Tree.
  * Graph Presets: Small ($V=100$), Medium ($V=1,000$), Large ($V=10,000$), Very Large ($V=100,000$).
  * Algorithm checkboxes: Dijkstra, A*, BFS.
  * Number of runs per algorithm (e.g., 5, 10) to compute statistical averages.
  * Random seed input for reproducible benchmarks.
* **Progress Indicator**: Real-time progress bar with an active cancellation option.
* **Comparative Visual Charts**: Simple, responsive bar charts displaying:
  * Execution Time Comparison (ms).
  * Nodes Visited Comparison.
* **Tabular Data View**: Structured comparative table displaying Min, Max, and Average execution times, Average nodes visited, Average edges examined, and Path Cost verification.

### 11.3 Responsive Behavior

* **Desktop (>1024px)**: 3-column layout (Controls | Canvas | Results) with persistent bottom playback bar.
* **Tablet (768px - 1024px)**: 2-column layout (Canvas on top/left, stacked Controls and Results panel).
* **Mobile (<768px)**: Vertically stacked layout (Canvas $\to$ Controls $\to$ Results $\to$ Playback) with collapsible drawer panels; zero horizontal page overflow.

### 11.4 Accessibility (a11y) & UX States

* **Keyboard Navigation**: All interactive controls, inputs, and buttons are keyboard accessible via `Tab`, `Enter`, `Space`, and `Arrow` keys.
* **WCAG Contrast**: All text, node badges, and state indicators conform to WCAG 2.1 AA color contrast standards. Non-color visual cues (labels, badges, line weights, dash arrays) guarantee usability for colorblind users.
* **Explicit UX States**: The application interface clearly reflects its current lifecycle state:
  `EMPTY_GRAPH`, `GRAPH_EDITING`, `READY_TO_RUN`, `RUNNING`, `PAUSED`, `STEPPING`, `COMPLETED`, `NO_PATH_FOUND`, `ERROR`, `BENCHMARKING`, `BENCHMARK_COMPLETE`.

---

## 12. Results & Algorithm Comparison

### 12.1 Route Results Display

Following algorithm execution, the results panel presents:
```text
Algorithm: Dijkstra
Route: A → C → F → Z
Total Cost: 42.70
Nodes Visited: 1,284
Edges Examined: 3,817
Relaxations: 1,420
Execution Time: 3.24 ms
```
If nodes are disconnected:
```text
Algorithm: Dijkstra
Route: No route exists between the selected nodes.
Total Cost: N/A
Nodes Visited: 15
Edges Examined: 24
Execution Time: 0.12 ms
```

### 12.2 Multi-Algorithm Comparison Mode

Users can select multiple algorithms to execute concurrently or sequentially against the **identical graph instance**, source, and destination:

| Metric | BFS | Dijkstra | A* (Euclidean) |
|---|---|---|---|
| **Path Found** | Yes | Yes | Yes |
| **Path Cost** | 52.00 *(hop-optimal)* | 42.70 *(cost-optimal)* | 42.70 *(cost-optimal)* |
| **Path Length (hops)** | 3 | 4 | 4 |
| **Nodes Visited** | 850 | 1,284 | 412 |
| **Edges Examined** | 2,100 | 3,817 | 1,293 |
| **Relaxations** | N/A | 1,420 | 485 |
| **Kernel Time** | 1.85 ms | 3.24 ms | 1.08 ms |

#### Educational Insights & Parity Checks
* The comparison view explicitly highlights whether Dijkstra and A* produced **identical optimal path costs**.
* Notes explain that BFS minimizes edge count (hops), not weighted edge cost.
* Results clarify that A*'s speedup depends on heuristic quality and graph topology, rather than presenting A* as universally superior in all problem spaces.

---

## 13. Benchmarking & Performance

### 13.1 Benchmark Methodology

To ensure scientific accuracy and prevent timing artifacts, the C++ benchmarking engine follows a strict 10-step protocol:
1. Parse graph configuration, topology parameters, algorithms, run count ($N \ge 5$), and random seed.
2. Construct the synthetic graph in C++ using `std::mt19937_64` for deterministic structure.
3. Validate graph connectivity; select a valid reachable source and destination pair.
4. Execute a warm-up pass for each selected algorithm to prime CPU instruction caches and memory allocators.
5. For each selected algorithm, execute $N$ repeated iterations on the identical in-memory graph.
6. Record execution times for each run using `std::chrono::high_resolution_clock`.
7. Compute statistical metrics: Minimum time, Maximum time, Mean time, and Standard Deviation.
8. Calculate average node expansions, edge examinations, and relaxations across runs.
9. Verify that all optimal algorithms produced identical path costs on successful runs.
10. Return an aggregate summary JSON payload to Node.js without visualization trace overhead.

### 13.2 Suggested Graph Sizes

* **Small**: 100 nodes, ~400 edges.
* **Medium**: 1,000 nodes, ~5,000 edges.
* **Large**: 10,000 nodes, ~50,000 edges.
* **Very Large**: 100,000 nodes, ~500,000 edges.
*(Sizes are user-configurable presets bounded only by available system RAM).*

### 13.3 Performance Metric Isolation

PathForge strictly isolates and reports the exact component timings:
* **Algorithm Kernel Time**: Pure C++ search execution measured inside the engine.
* **Serialization / IPC Time**: Time required to serialize JSON, pipe data across stdin/stdout, and deserialize in Node.js.
* **Network Latency**: HTTP transmission time between browser and Node.js.
* **UI Render Time**: React DOM and SVG canvas repaint time.

Only the **Algorithm Kernel Time** is evaluated in algorithmic performance comparisons.

---

## 14. REST API Specification

All backend endpoints use the `/api` prefix and communicate using standard JSON.

### 14.1 Endpoints Summary

```text
GET  /api/health
POST /api/graph/validate
POST /api/graph/generate
POST /api/algorithm/run
POST /api/algorithm/compare
POST /api/benchmark/run
```

No database CRUD endpoints exist.

### 14.2 Detailed Endpoint Contracts

#### `GET /api/health`
Checks server status and C++ engine binary discovery.
* **Response (200 OK)**:
  ```json
  {
    "status": "ok",
    "uptimeSeconds": 1420.5,
    "cppEngine": {
      "discovered": true,
      "path": "/engine/build/pathforge-engine"
    }
  }
  ```

#### `POST /api/graph/validate`
Validates graph JSON topology before loading or execution.
* **Request Body**: Complete graph JSON payload.
* **Response (200 OK - Valid)**:
  ```json
  {
    "valid": true,
    "nodeCount": 4,
    "edgeCount": 5
  }
  ```
* **Response (400 Bad Request - Invalid)**:
  ```json
  {
    "valid": false,
    "error": {
      "code": "INVALID_EDGE_ENDPOINT",
      "message": "Edge 'A -> X' references nonexistent target node 'X'."
    }
  }
  ```

#### `POST /api/graph/generate`
Generates a synthetic graph based on specified topology parameters.
* **Request Body**:
  ```json
  {
    "nodes": 100,
    "density": 0.05,
    "topology": "random",
    "directed": false,
    "weighted": true,
    "seed": 12345
  }
  ```
* **Response (200 OK)**: Graph JSON payload containing generated `nodes` and `edges`.

#### `POST /api/algorithm/run`
Executes a single pathfinding algorithm.
* **Request Body**:
  ```json
  {
    "graph": {
      "directed": false,
      "weighted": true,
      "nodes": [
        { "id": "A", "x": 100, "y": 100 },
        { "id": "B", "x": 200, "y": 150 },
        { "id": "C", "x": 300, "y": 100 }
      ],
      "edges": [
        { "source": "A", "target": "B", "weight": 5.0 },
        { "source": "B", "target": "C", "weight": 3.0 }
      ]
    },
    "algorithm": "dijkstra",
    "source": "A",
    "destination": "C",
    "mode": "visualization"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "algorithm": "dijkstra",
    "path": ["A", "B", "C"],
    "cost": 8.0,
    "nodesVisited": 3,
    "edgesExamined": 4,
    "relaxations": 2,
    "executionTimeMs": 0.24,
    "steps": [
      {
        "step": 1,
        "currentNode": "A",
        "action": "EXPAND_NODE",
        "frontier": ["B"],
        "visited": ["A"]
      }
    ]
  }
  ```

#### `POST /api/algorithm/compare`
Executes multiple algorithms on the same graph instance.
* **Request Body**: Similar to `/api/algorithm/run`, but accepts `algorithms: ["dijkstra", "astar", "bfs"]`.
* **Response (200 OK)**: Array of algorithm execution result objects with parity verification flag.

#### `POST /api/benchmark/run`
Executes a multi-run benchmark suite on a generated or uploaded graph in Benchmark Mode.
* **Request Body**:
  ```json
  {
    "graphConfig": {
      "nodes": 10000,
      "edges": 50000,
      "topology": "sparse",
      "seed": 42
    },
    "algorithms": ["dijkstra", "astar"],
    "heuristic": "euclidean",
    "runs": 5
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "graphSummary": { "nodes": 10000, "edges": 50000, "topology": "sparse" },
    "results": [
      {
        "algorithm": "dijkstra",
        "avgTimeMs": 82.4,
        "minTimeMs": 79.1,
        "maxTimeMs": 86.2,
        "avgNodesVisited": 9421,
        "avgEdgesExamined": 38172,
        "pathCost": 154.2
      },
      {
        "algorithm": "astar",
        "avgTimeMs": 31.2,
        "minTimeMs": 29.8,
        "maxTimeMs": 33.5,
        "avgNodesVisited": 2784,
        "avgEdgesExamined": 11239,
        "pathCost": 154.2
      }
    ],
    "costMatch": true
  }
  ```

---

## 15. C++ ↔ Node Integration

### 15.1 Process Lifecycle Management

Node.js manages C++ engine invocations via an asynchronous service module:

```typescript
import { spawn } from 'child_process';
import path from 'path';

export interface ExecutionRequest {
  graph: any;
  algorithm: string;
  source: string;
  destination: string;
  mode: 'visualization' | 'benchmark';
  heuristic?: string;
}

export function executeCppEngine(request: ExecutionRequest, timeoutMs = 15000): Promise<any> {
  return new Promise((resolve, reject) => {
    const enginePath = process.env.CPP_ENGINE_PATH || path.resolve(__dirname, '../../../engine/build/pathforge-engine');
    const child = spawn(enginePath, []);

    let stdoutData = '';
    let stderrData = '';

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('C++ engine execution timed out'));
    }, timeoutMs);

    child.stdout.on('data', (chunk) => { stdoutData += chunk; });
    child.stderr.on('data', (chunk) => { stderrData += chunk; });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        return reject(new Error(`C++ engine exited with code ${code}: ${stderrData}`));
      }
      try {
        const parsed = JSON.parse(stdoutData);
        resolve(parsed);
      } catch (err) {
        reject(new Error(`Failed to parse C++ engine JSON output: ${err.message}`));
      }
    });

    child.stdin.write(JSON.stringify(request));
    child.stdin.end();
  });
}
```

### 15.2 Security & Process Isolation
* **Zero Shell Injection**: The engine executable is spawned directly with an argument vector (`spawn(binaryPath, [])`). Node.js never interpolates user strings into shell commands (`exec` is strictly prohibited).
* **Process Sandboxing**: Each request runs in an isolated OS process. Memory corruption or unexpected crashes in one execution cannot pollute another request or crash the Node.js API server.
* **Execution Guardrails**: Configurable timeouts (e.g., 15 seconds) automatically terminate non-terminating loops. Input limits bound graph sizes to prevent host memory exhaustion.

---

## 16. Validation, Testing & Edge Cases

Correctness, input validation, automated testing, and edge-case handling form **one integrated, non-negotiable requirement**.

### 16.1 Engineering Priority Order

$$\text{Validation} \to \text{Correctness} \to \text{Unit Tests} \to \text{Integration Tests} \to \text{Performance Optimization} \to \text{Benchmarking}$$

Algorithms must be proven correct via automated test suites before performance tuning or benchmark evaluations occur.

### 16.2 Input Validation Rules

The Node.js API and C++ engine enforce rigorous validation:
* **Graph Structure**: Must contain valid `nodes` and `edges` arrays.
* **Empty Graph**: $V = 0$ is rejected with `EMPTY_GRAPH`.
* **Missing Nodes**: Source or destination node not present in graph is rejected with `SOURCE_NOT_FOUND` / `DESTINATION_NOT_FOUND`.
* **Dangling Edges**: Edges referencing non-existent node IDs are rejected with `INVALID_EDGE_ENDPOINT`.
* **Negative Weights**: Negative edge weights are rejected for Dijkstra and A* with `NEGATIVE_EDGE_WEIGHT`.
* **Duplicate Edges / Self-Loops**: Rejected by default unless explicitly permitted in graph configuration (`SELF_LOOP_REJECTED`, `DUPLICATE_EDGE_REJECTED`).
* **Missing Coordinates for A\***: Selecting Euclidean or Manhattan heuristics on graphs with missing node coordinates returns `MISSING_NODE_COORDINATES`.
* **Benchmark Limits**: Run count $N \le 0$ or negative node counts return `INVALID_BENCHMARK_PARAM`.

#### Structured Error Format
All errors return consistent, structured JSON responses:
```json
{
  "success": false,
  "error": {
    "code": "NEGATIVE_EDGE_WEIGHT",
    "message": "Dijkstra and A* do not support negative edge weights (Edge 'B -> C' has weight -3.5).",
    "details": {
      "source": "B",
      "target": "C",
      "weight": -3.5
    }
  }
}
```

### 16.3 Edge Cases & Expected Behaviors

| Edge Case | Input Condition | Required System Behavior |
|---|---|---|
| **Empty Graph** | 0 nodes, 0 edges. | Reject execution immediately with `EMPTY_GRAPH` error. |
| **Single Node** | 1 node, 0 edges ($S = A, D = A$). | Return valid path `["A"]` with cost `0.0`, 0 relaxations. |
| **Source Equals Destination** | Any graph where $S = D$. | Return path `[S]` with cost `0.0`, 0 relaxations. |
| **Disconnected Graph** | No valid path from $S$ to $D$. | Return `success: true`, `path: []`, `cost: null`, and message `"No route exists between the selected nodes."` |
| **Multiple Shortest Paths** | Multiple paths share identical minimal cost. | Return one valid optimal path deterministically based on node index ordering. |
| **Zero-Weight Edges** | Valid graph containing $w = 0$ edges. | Process correctly without infinite cycles; return optimal cost. |
| **Negative-Weight Edges** | Graph containing $w < 0$ edges. | Reject execution for Dijkstra and A* with `NEGATIVE_EDGE_WEIGHT`. |
| **Large Sparse Graph** | $V \ge 100,000, E \ge 500,000$. | Execute in Benchmark Mode without memory exhaustion or stack overflow. |
| **C++ Engine Fault** | C++ process crashes or exits abnormally. | Node.js intercepts error, logs diagnostic message, and returns structured 500 `ENGINE_CRASH` without crashing the API server. |

### 16.4 Automated Test Suites

#### 1. C++ GoogleTest Suite (`engine/tests/`)
* `GraphTest.cpp`: Node insertion, deletion, edge addition, adjacency list integrity, cascade deletion.
* `BFSTest.cpp`: Traversal order, unweighted shortest path, disconnected detection.
* `DFSTest.cpp`: Traversal completeness, cycle termination, non-optimal path verification.
* `DijkstraTest.cpp`: Known shortest path verification, zero-weight handling, negative weight rejection, disconnected graph handling.
* `AStarTest.cpp`: Heuristic admissibility, equivalence of Zero Heuristic to Dijkstra, Euclidean and Manhattan routing, coordinate validation.
* `BenchmarkTest.cpp`: Seed reproducibility, statistical calculation accuracy.

#### 2. Regression Testing Protocol
Every bug discovered during development must trigger the creation of a permanent regression test:
$$\text{Bug Discovered} \to \text{Create Failing Test} \to \text{Fix Implementation} \to \text{Confirm Test Passes} \to \text{Retain Permanently}$$

#### 3. Integration & Frontend Tests
* End-to-end integration tests verifying `Node.js API → C++ Engine → Node.js Response` pipeline using Vitest and Supertest.
* Frontend component tests verifying canvas event handling, algorithm selection, playback state updates, and error alerts.

---

## 17. Project Structure

PathForge is organized as a clean multi-tier monorepo:

```text
pathforge/
├── engine/                          # Native C++ Graph & Algorithm Engine
│   ├── CMakeLists.txt               # CMake build definition
│   ├── include/
│   │   ├── core/
│   │   │   ├── Types.h              # Common structs (Node, Edge, Metrics)
│   │   │   ├── Result.h             # Result wrapper and error structures
│   │   │   └── Logger.h             # Diagnostic logging utilities
│   │   ├── graph/
│   │   │   ├── Node.h               # Node model
│   │   │   ├── Edge.h               # Edge model
│   │   │   └── Graph.h              # Adjacency list graph implementation
│   │   ├── data_structures/
│   │   │   └── MinPriorityQueue.h   # Custom Binary Min-Heap wrapper
│   │   ├── algorithms/
│   │   │   ├── BFS.h                # Breadth-First Search
│   │   │   ├── DFS.h                # Depth-First Search
│   │   │   ├── Dijkstra.h           # Dijkstra's Algorithm
│   │   │   ├── AStar.h              # A* Search Algorithm
│   │   │   └── Heuristics.h         # Zero, Euclidean, Manhattan heuristics
│   │   ├── benchmark/
│   │   │   ├── GraphGenerator.h     # Synthetic graph generators (Random, Grid, etc.)
│   │   │   └── Benchmark.h          # Benchmark execution harness
│   │   └── serialization/
│   │       └── JsonBridge.h         # JSON parser & serializer bridge
│   ├── src/
│   │   ├── graph/
│   │   │   └── Graph.cpp
│   │   ├── algorithms/
│   │   │   ├── BFS.cpp
│   │   │   ├── DFS.cpp
│   │   │   ├── Dijkstra.cpp
│   │   │   └── AStar.cpp
│   │   ├── benchmark/
│   │   │   ├── GraphGenerator.cpp
│   │   │   └── Benchmark.cpp
│   │   └── main.cpp                 # CLI & IPC entry point (stdin/stdout JSON)
│   └── tests/                       # GoogleTest automated unit test suite
│       ├── CMakeLists.txt
│       ├── GraphTest.cpp
│       ├── BFSTest.cpp
│       ├── DFSTest.cpp
│       ├── DijkstraTest.cpp
│       ├── AStarTest.cpp
│       └── BenchmarkTest.cpp
│
├── server/                          # Node.js + Express + TypeScript API Server
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── app.ts                   # Express application setup & middleware
│       ├── server.ts                # HTTP server listener
│       ├── controllers/
│       │   ├── algorithmController.ts
│       │   ├── benchmarkController.ts
│       │   └── graphController.ts
│       ├── routes/
│       │   ├── algorithmRoutes.ts
│       │   ├── benchmarkRoutes.ts
│       │   └── graphRoutes.ts
│       ├── services/
│       │   ├── cppEngineService.ts  # C++ child process spawning & stdin/stdout pipe
│       │   └── validationService.ts # JSON schema validation logic
│       ├── middleware/
│       │   ├── errorHandler.ts      # Global structured error handler
│       │   └── validator.ts         # Request validation middleware
│       └── types/
│           └── api.ts               # Shared TypeScript request/response contracts
│
├── client/                          # React + TypeScript + Vite Frontend
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx                 # React DOM entry point
│       ├── App.tsx                  # Root component & layout router
│       ├── pages/
│       │   ├── Workspace.tsx        # Interactive Graph Editor & Visualizer
│       │   └── Benchmark.tsx        # Benchmark Dashboard & Comparison View
│       ├── components/
│       │   ├── Header/
│       │   ├── GraphCanvas/         # SVG/Canvas graph renderer
│       │   ├── GraphControls/       # Node/edge editing toolbar
│       │   ├── AlgorithmSelector/   # Algorithm & heuristic picker
│       │   ├── PlaybackControls/    # Play, pause, step forward/backward, speed slider
│       │   ├── ResultsPanel/        # Formatted route & metrics display
│       │   ├── ComparisonPanel/     # Multi-algorithm comparison table
│       │   └── BenchmarkPanel/      # Synthetic generator controls & charts
│       ├── hooks/
│       │   ├── useGraph.ts          # Graph state management hook
│       │   └── usePlayback.ts       # Visual animation playback hook
│       ├── services/
│       │   └── api.ts               # API client HTTP methods
│       ├── types/
│       │   └── graph.ts             # Client-side graph & playback types
│       └── utils/
│           ├── geometry.ts          # 2D Euclidean distance & vector math
│           └── export.ts            # Browser Blob JSON download helpers
│
├── README.md                        # Master technical documentation
├── .env.example                     # Environment configuration template
└── .gitignore
```

---

## 18. Development Phases

PathForge is implemented in 10 structured, sequential phases:

```text
Phase 1: C++ Graph Core ───────────► Phase 2: BFS & DFS
                                             │
Phase 4: C++ JSON Interface ◄─────── Phase 3: Dijkstra & A*
        │
        ▼
Phase 5: Node.js Express API ──────► Phase 6: React Graph Editor
                                             │
Phase 8: Benchmarking & Charts ◄──── Phase 7: Algorithm Visualization
        │
        ▼
Phase 9: Import/Export & Results ──► Phase 10: Hardening & Documentation
```

* **Phase 1 — C++ Graph Core**: Implement `Graph`, `Node`, `Edge`, contiguous vertex index mappings, adjacency list representations, edge insertion/deletion, and unit tests.
* **Phase 2 — Traversal Algorithms**: Implement BFS and DFS with predecessor tracking, path reconstruction, and cycle termination tests.
* **Phase 3 — Shortest Path Algorithms**: Implement custom `MinPriorityQueue`, Dijkstra's algorithm, A* search with heuristics (Zero, Euclidean, Manhattan), and GoogleTest test suites.
* **Phase 4 — C++ JSON Interface & Modes**: Implement `JsonBridge` supporting `stdin`/`stdout` streaming, dual execution modes (Visualization trace vs. Benchmark aggregate), and CLI arguments.
* **Phase 5 — Node.js Express API**: Set up TypeScript server, request validation schemas, `cppEngineService` process spawner, structured error mapping, and `/api` endpoints.
* **Phase 6 — React Graph Editor**: Build interactive canvas (SVG/Canvas), node/edge creation, dragging, deletion, graph property toggles, and source/destination selection.
* **Phase 7 — Algorithm Visualization**: Connect frontend to API, implement step-by-step animation engine, playback controls (Play, Pause, Step, Speed), and dynamic node/edge visual states.
* **Phase 8 — Benchmarking & Synthetic Generators**: Implement synthetic graph generators in C++, multi-run benchmark orchestrator, performance aggregation, and frontend comparison charts.
* **Phase 9 — File Portability & Export**: Build JSON graph import with schema validation, graph export, and experiment result export.
* **Phase 10 — Hardening & Finalization**: Conduct end-to-end integration tests, verify responsive layouts, audit accessibility (a11y), complete the comprehensive README, and configure production builds.

---

## 19. MVP (Minimum Viable Product)

The MVP is complete when the following 12 capabilities work reliably end-to-end:

1. User can interactively construct a weighted graph on the canvas.
2. User can add, reposition (drag), and delete nodes and edges.
3. User can designate distinct source and destination nodes.
4. User can trigger Dijkstra's algorithm via the C++ engine.
5. Canvas displays an animated visual progression of Dijkstra's search wave.
6. User can view the final reconstructed optimal path sequence.
7. User can view total path cost and traversal statistics (nodes visited, edges examined, execution time).
8. User can execute A* search with Euclidean and Zero heuristics.
9. User can view a side-by-side comparison of Dijkstra and A* results on the same graph.
10. User can reset canvas and graph state cleanly.
11. User can export the constructed graph to a downloadable JSON file.
12. The application operates **100% database-free** with in-memory execution.

---

## 20. Advanced Features

Following MVP stabilization, the advanced feature set is implemented:
* Full BFS and DFS algorithm integration with specialized traversal animations.
* Manhattan distance heuristic for 2D grid topologies.
* Synthetic graph generators (Random, Sparse, Dense, Grid, Tree) parameterized by node counts and random seeds.
* Large-scale benchmark dashboard supporting graphs from 1,000 to 100,000+ nodes in Benchmark Mode.
* Performance comparison charts visualizing execution time and node expansion tradeoffs.
* Granular step-by-step playback controls (Step Forward, Step Backward, Variable Speed Slider).
* JSON graph file import with comprehensive schema and semantic validation.
* Complete experimental run export (graph topology + route + metrics).
* Automated regression test suite covering all identified edge cases.

---

## 21. Deployment & Configuration

### 21.1 Environment Configuration (`.env`)

Configuration is managed via environment variables. An `.env.example` file is provided in the repository root:

```ini
# Node.js Server Port
PORT=5000

# Node Environment (development | production)
NODE_ENV=development

# Relative or Absolute Path to Compiled C++ Executable
CPP_ENGINE_PATH=../engine/build/pathforge-engine
```

**Strict Rule**: Environment variables must never contain database connection strings, credentials, or serialized graph data.

### 21.2 Build & Execution Commands

#### 1. Compile C++ Algorithm Engine
```bash
cd engine
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
# Run GoogleTest Suite
ctest --test-dir build --output-on-failure
```

#### 2. Launch Backend API Server
```bash
cd server
npm install
npm run build
npm run dev
```

#### 3. Launch Frontend Client
```bash
cd client
npm install
npm run build
npm run dev
```

### 21.3 Production Deployment Considerations
* **Static Asset Serving**: In production, the React frontend is compiled to static assets (`client/dist`) and served either directly via Express or via an Nginx reverse proxy.
* **Native Binary Permissions**: Ensure the compiled C++ executable has proper execution permissions (`chmod +x pathforge-engine`) in host environments or Docker containers.
* **Containerization**: A standard Dockerfile compiles the C++ engine in a multi-stage build, builds the Node.js and React codebases, and exposes port `5000` with zero persistent volume requirements.

---

## 22. Documentation Requirements

The repository's master `README.md` must be comprehensive and technically thorough:
* **Project Overview & Philosophy**: Core identity, DSA-first focus, and high-level architectural diagram.
* **Data Structures & Algorithm Explanations**: In-depth explanations of Adjacency Lists, Binary Heaps, BFS, DFS, Dijkstra, and A*.
* **Complexity Reference Table**:
  | Algorithm | Time Complexity | Space Complexity | Optimality Guarantee |
  |---|---|---|---|
  | **BFS** | $O(V + E)$ | $O(V)$ | Optimal on unweighted graphs (min hops). |
  | **DFS** | $O(V + E)$ | $O(V)$ | Non-optimal; traversal only. |
  | **Dijkstra** | $O((V + E) \log V)$ | $O(V)$ | Provably optimal for $w \ge 0$. |
  | **A\*** | $O((V + E) \log V)$ | $O(V)$ | Optimal when $h(n)$ is admissible & consistent. |
* **Build & Setup Guide**: Exact step-by-step commands to build the C++ engine, run unit tests, and start development servers.
* **Documented Architectural & Design Decisions**:
  1. *Why C++ for the core engine?* Sub-millisecond execution speeds, deterministic memory allocation, absence of garbage collection latency during large graph iterations, and authentic demonstration of native DSA principles.
  2. *Why an Adjacency List over an Adjacency Matrix?* Optimal space complexity $O(V + E)$ vs $O(V^2)$ allows processing large sparse networks ($V = 100,000, E = 500,000$) without memory exhaustion.
  3. *Why a custom Priority Queue / Min-Heap wrapper?* Demonstrates core binary heap operations (sift-up, sift-down, $O(\log V)$ extraction) while encapsulating relaxation indexing.
  4. *Why A\* in addition to Dijkstra?* Demonstrates heuristic-directed search, showing how domain knowledge prunes search spaces while maintaining optimality.
  5. *Why no database?* Maintains pure algorithmic focus; graph structures are analytical models loaded in-memory or persisted via portable JSON files. Eliminates environment friction.
  6. *Why Node.js/Express between C++ and React?* Provides a robust REST interface, JSON schema validation, process lifecycle protection, and cross-platform web client access.
  7. *Why separate Visualization Mode and Benchmark Mode?* Prevents generating millions of trace events during large graph benchmarks, isolating pure algorithmic performance from serialization overhead.

---

## 23. Scope Restrictions

To preserve the project's strict algorithmic integrity and educational value, the following features are **explicitly out of scope and must not be implemented**:
* **No Database**: No SQL, NoSQL, ORMs, or persistent stores.
* **No Authentication / Accounts**: No user signup, login, sessions, JWTs, or role-based access controls.
* **No Payments / Commercialization**: No payment gateways, subscriptions, or paywalls.
* **No Social / Collaboration Tools**: No live chat, comments, user profiles, or multi-user collaborative editing.
* **No Third-Party Real-World Mapping APIs**: No integration with Google Maps, Leaflet, OpenStreetMap, or Mapbox. Graphs represent abstract 2D coordinate topologies.
* **No Generic CRUD Modules**: No database entity management or admin dashboards.
* **No Client-Side Pathfinding Reimplementation**: The React client must never execute pathfinding algorithms locally.

---

## 24. Final Acceptance Criteria

The PathForge project is complete and ready for deployment when all of the following criteria are satisfied:

1. **Algorithmic Correctness**: BFS, DFS, Dijkstra, and A* produce verifiably correct paths, exact costs, and correct termination on all validated inputs.
2. **Automated Testing Coverage**: The C++ GoogleTest suite executes cleanly with all unit tests passing, covering graph mutations, algorithm kernels, and all identified edge cases.
3. **Integration Reliability**: The full pipeline (`React → Node.js API → C++ Engine → Node.js → React`) operates seamlessly via standard pipes with zero unhandled exceptions.
4. **Visual Clarity**: Algorithm execution is clearly understandable through dynamic node and edge visual states, responsive playback controls, and formatted route results.
5. **Benchmark Performance**: Large graphs ($V \ge 10,000$) execute in Benchmark Mode with sub-second response times and zero memory leaks.
6. **Data Portability**: Graphs and experimental logs can be imported and exported cleanly via valid JSON files without persistent server storage.
7. **Database-Free Compliance**: The application runs entirely in runtime memory with zero database dependencies.
8. **Documentation Excellence**: The README enables any engineer to clone, compile, test, and run the system with zero ambiguity.
9. **Technical Defensibility**: The entire architecture, data structures, complexity curves, and design trade-offs can be explained and defended in a senior software engineering placement interview.