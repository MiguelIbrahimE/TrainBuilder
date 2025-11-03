# Development Guide

## Prerequisites

- **Node.js** 20+ and npm
- **Docker** & Docker Compose
- **PostgreSQL** 15+ (or use Docker)
- **Git**

## Project Structure

```
TrainBuilder/
├── frontend/          # React app (port 5173 in dev)
├── backend/           # Express API (port 3000)
├── documentation/     # All docs
├── docker-compose.yml # Full stack orchestration
└── README.md
```

## Initial Setup

### 1. Clone Repository
```bash
git clone https://github.com/YourUsername/TrainBuilder.git
cd TrainBuilder
```

### 2. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
npm install
cd ..
```

### 3. Environment Variables

Create `.env` files for each service:

**Backend (.env in backend/):**
```env
# Server
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://trainbuilder:password@localhost:5432/trainbuilder
POSTGRES_USER=trainbuilder
POSTGRES_PASSWORD=password
POSTGRES_DB=trainbuilder

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

**Frontend (.env in root/):**
```env
VITE_API_URL=http://localhost:3000/api
```

## Development Workflows

### Option 1: Docker Compose (Recommended)

Start the entire stack with one command:

```bash
# Start all services
docker-compose up

# Or in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

Services:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5432

### Option 2: Local Development

Useful when you want hot-reloading and debugging.

**Terminal 1 - Database:**
```bash
docker-compose up postgres
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Frontend:**
```bash
npm run dev
```

### Option 3: Hybrid (Frontend local, Backend+DB in Docker)

```bash
# Start backend services
docker-compose up backend postgres

# Run frontend locally
npm run dev
```

## Database Management

### Migrations

Using Prisma:

```bash
cd backend

# Create a new migration
npm run db:migrate:create

# Run migrations
npm run db:migrate

# Reset database (WARNING: deletes all data)
npm run db:reset
```

### Seed Data

```bash
cd backend
npm run db:seed
```

Seeds include:
- Test user account (`test@example.com` / `password123`)
- Sample network
- 50+ European cities

### Database Access

**Using psql:**
```bash
# Via Docker
docker exec -it trainbuilder-postgres psql -U trainbuilder -d trainbuilder

# Or locally
psql postgresql://trainbuilder:password@localhost:5432/trainbuilder
```

**Using GUI (pgAdmin, DBeaver, etc.):**
- Host: localhost
- Port: 5432
- Database: trainbuilder
- User: trainbuilder
- Password: password

## Common Tasks

### Run Tests

**Backend:**
```bash
cd backend
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
```

**Frontend:**
```bash
npm test
npm run test:ui             # Vitest UI
```

### Linting & Formatting

**Backend:**
```bash
cd backend
npm run lint                # ESLint
npm run lint:fix            # Auto-fix
npm run format              # Prettier
```

**Frontend:**
```bash
npm run lint
npm run lint:fix
```

### Build for Production

**Backend:**
```bash
cd backend
npm run build               # Compiles TypeScript to dist/
npm start                   # Run production build
```

**Frontend:**
```bash
npm run build               # Creates dist/ folder
npm run preview             # Preview production build
```

## Debugging

### Backend (VS Code)

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/backend/src/index.ts",
      "preLaunchTask": "tsc: build - backend/tsconfig.json",
      "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

### Frontend (Browser DevTools)

- Source maps enabled by default in Vite
- React DevTools extension recommended
- Redux DevTools for Zustand debugging

### Database Queries

Enable query logging in development:

**backend/src/db/client.ts:**
```typescript
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});
```

## Performance Profiling

### Backend

```bash
# Profile with Node.js built-in profiler
node --prof dist/index.js

# Analyze profile
node --prof-process isolate-*-v8.log > profile.txt
```

### Frontend

- Use React DevTools Profiler
- Chrome Performance tab
- Lighthouse for overall metrics

## Common Issues & Solutions

### Port Already in Use

```bash
# Find process using port
lsof -i :3000
lsof -i :5173

# Kill process
kill -9 <PID>
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs trainbuilder-postgres

# Restart database
docker-compose restart postgres
```

### Node Modules Issues

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Or use npm ci for clean install
npm ci
```

### TypeScript Errors

```bash
# Rebuild TypeScript
npm run build

# Check for type errors
npx tsc --noEmit
```

## Project-Specific Commands

### Generate Prisma Client

After changing `schema.prisma`:
```bash
cd backend
npm run prisma:generate
```

### View Database Schema

```bash
cd backend
npm run prisma:studio
```
Opens Prisma Studio at http://localhost:5555

### Reset Everything

```bash
# Stop all containers
docker-compose down -v

# Remove all data
rm -rf backend/dist
rm -rf frontend/dist
rm -rf node_modules
rm -rf backend/node_modules

# Reinstall
npm install
cd backend && npm install && cd ..

# Start fresh
docker-compose up --build
```

## Git Workflow

### Branch Naming
- `feature/station-placement`
- `fix/budget-calculation`
- `refactor/api-routes`
- `docs/api-endpoints`

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add station creation endpoint
fix: correct budget deduction logic
docs: update API documentation
refactor: extract track validation logic
test: add tests for station service
```

### Pull Request Process

1. Create feature branch from `main`
2. Implement changes
3. Update relevant documentation
4. Write/update tests
5. Run linter and tests locally
6. Create PR with description
7. Address review comments
8. Merge after approval

## Code Style Guidelines

### TypeScript
- Use strict mode
- Prefer interfaces over types for objects
- Use descriptive variable names
- Add JSDoc comments for public APIs

### React
- Functional components with hooks
- Use TypeScript for props
- Keep components small and focused
- Extract custom hooks for reusable logic

### API Design
- RESTful conventions
- Consistent error responses
- Validate all inputs
- Use HTTP status codes correctly

## Documentation Updates

When making changes, update relevant docs:

| Change Type | Update Docs |
|-------------|-------------|
| New API endpoint | `documentation/api.md` |
| Database schema | `documentation/database.md` |
| Architecture | `documentation/architecture.md` |
| Setup process | `documentation/development.md` |
| Features | `documentation/idea.md` & `README.md` |

## Resources

### Documentation
- [Express.js Docs](https://expressjs.com/)
- [Prisma Docs](https://www.prisma.io/docs)
- [PostGIS Reference](https://postgis.net/docs/)
- [React Docs](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)

### Tools
- [Postman](https://www.postman.com/) - API testing
- [pgAdmin](https://www.pgadmin.org/) - PostgreSQL GUI
- [React DevTools](https://react.dev/learn/react-developer-tools)

## Getting Help

1. Check documentation in `documentation/`
2. Search existing issues on GitHub
3. Ask in project Discord/Slack
4. Create new issue with reproduction steps

## Next Steps

After setup:

1. ✅ Run `docker-compose up` to start everything
2. ✅ Access frontend at http://localhost:5173
3. ✅ Test API at http://localhost:3000/api/health
4. ✅ Login with test account: `test@example.com` / `password123`
5. ✅ Create your first railway network!

Happy coding! 🚂
