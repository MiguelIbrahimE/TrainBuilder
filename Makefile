.PHONY: help dev prod build-dev build-prod up-dev up-prod down logs clean backend frontend

# Default target
help:
	@echo "Train Builder - Docker Commands"
	@echo ""
	@echo "Full Stack:"
	@echo "  make dev          - Run full stack in development mode"
	@echo "  make prod         - Run full stack in production mode"
	@echo ""
	@echo "Individual Services:"
	@echo "  make backend      - Run backend only (port 3000)"
	@echo "  make frontend     - Run frontend only (port 5173)"
	@echo ""
	@echo "Building:"
	@echo "  make build        - Build all images"
	@echo "  make build-dev    - Build development images"
	@echo "  make build-prod   - Build production images"
	@echo ""
	@echo "General:"
	@echo "  make down         - Stop all containers"
	@echo "  make logs         - View logs from all containers"
	@echo "  make logs-backend - View backend logs"
	@echo "  make logs-frontend- View frontend logs"
	@echo "  make clean        - Stop containers and remove volumes"
	@echo "  make rebuild      - Clean and rebuild everything"

# Development (full stack)
dev: build-dev
	docker-compose up backend frontend-dev

build-dev:
	docker-compose build backend frontend-dev

# Production (full stack)
prod: build-prod up-prod

build-prod:
	docker-compose build backend frontend-prod

up-prod:
	docker-compose up -d backend frontend-prod
	@echo "Backend API running at http://localhost:3000"
	@echo "Frontend running at http://localhost:8080"
	@echo "Run 'make logs' to view logs"

# Individual services
backend:
	docker-compose up backend

frontend:
	docker-compose up frontend-dev

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
