# Use Ubuntu as base image
FROM ubuntu:22.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libsdl2-dev \
    libsdl2-image-dev \
    libsdl2-ttf-dev \
    libcurl4-openssl-dev \
    libpng-dev \
    pkg-config \
    x11-apps \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy source files
COPY . .

# Create build directory and compile
RUN mkdir -p build && \
    cd build && \
    cmake .. && \
    make

# Create tiles directory
RUN mkdir -p /app/build/tiles

# Set display environment variable (will be overridden by docker-compose)
ENV DISPLAY=:0

# Run the game
WORKDIR /app/build
CMD ["./TrainBuilder"]
