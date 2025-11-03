.PHONY: help dev prod build-dev build-prod up-dev up-prod down logs clean

# Default target
help:
	@echo "Train Builder - Docker Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Build and run development server (http://localhost:5173)"
	@echo "  make build-dev    - Build development Docker image"
	@echo "  make up-dev       - Start development container"
	@echo ""
	@echo "Production:"
	@echo "  make prod         - Build and run production server (http://localhost:8080)"
	@echo "  make build-prod   - Build production Docker image"
	@echo "  make up-prod      - Start production container"
	@echo ""
	@echo "General:"
	@echo "  make down         - Stop all containers"
	@echo "  make logs         - View logs from all containers"
	@echo "  make logs-dev     - View development logs"
	@echo "  make logs-prod    - View production logs"
	@echo "  make clean        - Stop containers and remove volumes"
	@echo "  make rebuild      - Clean and rebuild everything"

# Development
dev: build-dev up-dev

build-dev:
	docker-compose build dev

up-dev:
	docker-compose up dev

# Production
prod: build-prod up-prod

build-prod:
	docker-compose build prod

up-prod:
	docker-compose up -d prod
	@echo "Production server running at http://localhost:8080"
	@echo "Run 'make logs-prod' to view logs"

# General commands
down:
	docker-compose down

logs:
	docker-compose logs -f

logs-dev:
	docker-compose logs -f dev

logs-prod:
	docker-compose logs -f prod

clean:
	docker-compose down -v
	@echo "Containers and volumes removed"

rebuild: clean
	docker-compose build --no-cache
	@echo "Rebuild complete"

# Quick start commands
start-dev:
	docker-compose up -d dev
	@echo "Development server running at http://localhost:5173"

start-prod:
	docker-compose up -d prod
	@echo "Production server running at http://localhost:8080"

restart:
	docker-compose restart

status:
	docker-compose ps
