#!/bin/bash

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Detect OS and run appropriate script
if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Running Unix database setup..."
    (cd "$SCRIPT_DIR" && chmod +x setup-db.sh && ./setup-db.sh)
elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]]; then
    echo "Detected Windows - please run setup-db.ps1 instead"
    exit 1
else
    echo "Unsupported OS: $OSTYPE"
    exit 1
fi