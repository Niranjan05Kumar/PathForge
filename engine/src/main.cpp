#include <iostream>
#include <string>
#include "ipc/JsonBridge.h"

int main(int argc, char* argv[]) {
    if (argc > 1) {
        std::string arg = argv[1];
        if (arg == "--version" || arg == "-v") {
            std::cout << "PathForge Engine v0.1.0 (DSA Core)" << std::endl;
            return 0;
        }
        if (arg == "--help" || arg == "-h") {
            std::cout << "PathForge Native C++ Engine\n"
                      << "Usage:\n"
                      << "  pathforge-engine [--ipc]     Read JSON from stdin, write response to stdout\n"
                      << "  pathforge-engine --version   Print engine version\n"
                      << "  pathforge-engine --help      Print this help message" << std::endl;
            return 0;
        }
    }

    // Standard IPC execution: stream JSON from stdin to stdout
    JsonBridge::processStream(std::cin, std::cout);
    return 0;
}
