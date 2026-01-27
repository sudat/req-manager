#!/bin/bash
# Check if a port is in use and return process information
# Usage: check_port.sh <port>

PORT=$1

if [ -z "$PORT" ]; then
    echo "Usage: $0 <port>"
    exit 1
fi

# Check if port is in use
if lsof -i :$PORT >/dev/null 2>&1; then
    echo "Port $PORT is in use:"
    lsof -i :$PORT -P -n | grep LISTEN
    exit 0
else
    echo "Port $PORT is available"
    exit 1
fi
