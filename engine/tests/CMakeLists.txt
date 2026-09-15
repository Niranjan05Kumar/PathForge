add_executable(engine_smoke_test SmokeTest.cpp)
target_link_libraries(engine_smoke_test
    PRIVATE
        GTest::gtest_main
)

add_executable(engine_graph_test GraphTest.cpp)
target_link_libraries(engine_graph_test
    PRIVATE
        pathforge_core
        GTest::gtest_main
)

add_executable(engine_bfs_test BFSTest.cpp)
target_link_libraries(engine_bfs_test
    PRIVATE
        pathforge_core
        GTest::gtest_main
)

add_executable(engine_dfs_test DFSTest.cpp)
target_link_libraries(engine_dfs_test
    PRIVATE
        pathforge_core
        GTest::gtest_main
)

add_executable(engine_dijkstra_test DijkstraTest.cpp)
target_link_libraries(engine_dijkstra_test
    PRIVATE
        pathforge_core
        GTest::gtest_main
)

include(GoogleTest)
gtest_discover_tests(engine_smoke_test)
gtest_discover_tests(engine_graph_test)
gtest_discover_tests(engine_bfs_test)
gtest_discover_tests(engine_dfs_test)
gtest_discover_tests(engine_dijkstra_test)
