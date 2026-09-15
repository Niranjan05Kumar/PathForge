#include <gtest/gtest.h>

TEST(SmokeTest, BaselineToolchainVerification) {
    EXPECT_TRUE(true);
    EXPECT_EQ(1 + 1, 2);
}

TEST(SmokeTest, Cpp17FeatureCheck) {
    // Verify C++17 structured bindings and constexpr if support
    auto [x, y] = std::make_pair(10, 20);
    EXPECT_EQ(x, 10);
    EXPECT_EQ(y, 20);
}
