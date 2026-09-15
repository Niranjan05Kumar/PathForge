#pragma once

#include <iostream>
#include <string>

class JsonBridge {
public:
    static void processStream(std::istream& in, std::ostream& out);
    static std::string processString(const std::string& inputJson);
};
