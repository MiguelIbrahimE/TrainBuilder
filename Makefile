# Makefile for Train Builder

.PHONY: all build run clean docker-vnc docker-x11 help

help:
	@echo "Train Builder - Build Commands"
	@echo "==============================="
	@echo ""
	@echo "Native builds:"
	@echo "  make build        - Build the game natively"
	@echo "  make run          - Build and run the game natively"
	@echo "  make clean        - Clean build files"
	@echo ""
	@echo "Docker builds:"
	@echo "  make docker-vnc   - Run with Docker + VNC (easiest)"
	@echo "  make docker-x11   - Run with Docker + X11 (faster)"
	@echo "  make docker-stop  - Stop all Docker containers"
	@echo ""

build:
	@echo "Building Train Builder..."
	@mkdir -p build
	@cd build && cmake .. && make
	@echo "Build complete! Run with: ./build/TrainBuilder"

run: build
	@echo "Running Train Builder..."
	@./build/TrainBuilder

clean:
	@echo "Cleaning build files..."
	@rm -rf build
	@echo "Clean complete!"

docker-vnc:
	@echo "Starting Train Builder with VNC..."
	@echo "Connect with VNC client to: localhost:5900"
	@echo "Password: trainbuilder"
	@docker-compose -f docker-compose.vnc.yml up --build

docker-x11:
	@echo "Starting Train Builder with X11..."
	@./run-docker.sh

docker-stop:
	@echo "Stopping Docker containers..."
	@docker-compose -f docker-compose.yml down
	@docker-compose -f docker-compose.vnc.yml down
	@echo "Containers stopped!"

all: build
