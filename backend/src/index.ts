import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import computationRoutes from './routes/computation.routes';
import networkRoutes from './routes/network.routes';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(helmet());

// CORS - allow frontend to access
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

// Compression for responses
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (development)
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  });
});

// API routes
app.use('/api/compute', computationRoutes);
app.use('/api/network', networkRoutes);

// Static tiles serving with CORS headers
// Expect tiles to be available under a directory specified by TILE_DIR or default to ../tiles
const tilesDir = process.env.TILE_DIR || path.join(__dirname, '..', 'tiles');

// Custom middleware for tiles to set CORP headers
app.use('/tiles', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

app.use('/tiles', express.static(tilesDir, {
  maxAge: '30d',
  immutable: true,
}));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: NODE_ENV === 'development' ? err.message : 'Internal Server Error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
┌─────────────────────────────────────────┐
│   Train Builder - Computation Backend   │
├─────────────────────────────────────────┤
│  Environment: ${NODE_ENV.padEnd(24)} │
│  Port: ${String(PORT).padEnd(31)} │
│  Status: Running ✓                     │
└─────────────────────────────────────────┘

Endpoints:
  GET  /health              - Health check
  POST /api/compute/*       - Computation APIs
  GET  /tiles/{z}/{x}/{y}.png - Static map tiles (preloaded)

Ready to handle requests!
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
