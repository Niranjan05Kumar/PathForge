#pragma once

struct AlgorithmOptions {
    bool recordTrace{true};

    AlgorithmOptions() = default;
    explicit AlgorithmOptions(bool recordTrace) : recordTrace(recordTrace) {}
};
