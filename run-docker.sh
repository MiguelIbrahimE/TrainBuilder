#!/bin/bash

echo "Train Builder - Docker Setup"
echo "============================="
echo ""

# Check if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Detected macOS - Setting up XQuartz..."
    echo ""

    # Check if XQuartz is installed
    if ! command -v xquartz &> /dev/null; then
        echo "ERROR: XQuartz is not installed!"
        echo "Please install XQuartz:"
        echo "  brew install --cask xquartz"
        echo ""
        echo "After installation:"
        echo "  1. Open XQuartz (from Applications > Utilities)"
        echo "  2. Go to XQuartz > Preferences > Security"
        echo "  3. Check 'Allow connections from network clients'"
        echo "  4. Restart XQuartz"
        echo "  5. Run this script again"
        exit 1
    fi

    # Get IP address
    IP=$(ifconfig en0 | grep inet | awk '$1=="inet" {print $2}')
    if [ -z "$IP" ]; then
        IP=$(ifconfig en1 | grep inet | awk '$1=="inet" {print $2}')
    fi

    if [ -z "$IP" ]; then
        echo "ERROR: Could not determine IP address"
        exit 1
    fi

    echo "Your IP address: $IP"
    echo ""

    # Allow X11 forwarding from localhost
    xhost + $IP

    # Export display
    export DISPLAY=$IP:0

    echo "Display set to: $DISPLAY"
    echo ""

elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Detected Linux - Using native X11..."
    echo ""

    # Allow local connections
    xhost +local:docker

    export DISPLAY=:0

else
    echo "WARNING: Unsupported OS. This might not work."
fi

echo "Building and running Train Builder..."
echo ""

# Build and run with docker-compose
docker-compose up --build

# Cleanup X11 permissions on exit
if [[ "$OSTYPE" == "darwin"* ]]; then
    xhost - $IP
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xhost -local:docker
fi
