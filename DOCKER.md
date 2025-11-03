# Docker Setup for Train Builder

This document explains how to run Train Builder using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

### Development Mode (with hot-reloading)

Run the development server with live code reloading:

```bash
docker-compose up dev
```

The application will be available at: **http://localhost:5173**

Changes to your source code will automatically reload in the browser.

### Production Mode

Build and run the optimized production build:

```bash
docker-compose up prod
```

The application will be available at: **http://localhost:8080**

## Detailed Commands

### Build Images

```bash
# Build development image
docker-compose build dev

# Build production image
docker-compose build prod

# Build both
docker-compose build
```

### Run Containers

```bash
# Run in foreground (with logs)
docker-compose up dev

# Run in background (detached)
docker-compose up -d dev

# Stop containers
docker-compose down
```

### View Logs

```bash
# View logs for dev service
docker-compose logs -f dev

# View logs for prod service
docker-compose logs -f prod
```

### Clean Up

```bash
# Stop and remove containers
docker-compose down

# Remove containers, volumes, and images
docker-compose down -v --rmi all
```

## Docker Configuration

### Ports

- **Development**: Port 5173 (Vite dev server)
- **Production**: Port 8080 (Nginx)

You can change these ports in `docker-compose.yml`:

```yaml
ports:
  - "YOUR_PORT:5173"  # for dev
  - "YOUR_PORT:80"     # for prod
```

### Environment Variables

Development mode uses `NODE_ENV=development` by default.

You can add more environment variables in `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=development
  - VITE_API_URL=http://api.example.com
```

## Troubleshooting

### Port Already in Use

If you see "port is already allocated" error:

```bash
# Stop existing containers
docker-compose down

# Or change the port in docker-compose.yml
```

### Rebuild After Code Changes (Production)

Production builds are static. After code changes:

```bash
docker-compose down
docker-compose build prod
docker-compose up prod
```

### Permission Issues

If you encounter permission issues with volumes:

```bash
# Fix ownership
docker-compose down
sudo chown -R $USER:$USER .
docker-compose up dev
```

### Clear Docker Cache

If builds are failing:

```bash
# Remove all containers, images, and volumes
docker-compose down -v
docker system prune -a

# Rebuild
docker-compose build --no-cache
```

## Architecture

### Multi-Stage Dockerfile

The Dockerfile uses multi-stage builds:

1. **Development**: Node.js with Vite dev server
2. **Builder**: Compiles TypeScript and builds optimized bundle
3. **Production**: Nginx serving static files

### Volume Mounting (Development)

Development mode mounts your local directory for hot-reloading:

```yaml
volumes:
  - .:/app              # Mount source code
  - /app/node_modules   # Prevent overwriting node_modules
```

## Health Checks

Production nginx includes a health check endpoint:

```bash
curl http://localhost:8080/health
# Output: healthy
```

## Performance Tips

1. **Use production mode** for deployment
2. **Development mode** is optimized for rapid iteration
3. **nginx.conf** includes gzip compression and caching headers
4. Static assets are cached for 1 year in production

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Build Docker Image
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build production image
        run: docker-compose build prod
```
