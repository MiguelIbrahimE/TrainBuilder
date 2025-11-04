import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import computationRoutes from './routes/computation.routes';
import networkRoutes from './routes/network.routes';
import geodataRoutes from './routes/geodata.routes';
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
    version: '1.0.0',
  });
});

// API routes
app.use('/api/compute', computationRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/geodata', geodataRoutes);

// Static tiles serving with CORS headers
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

// Serve available regions
app.get('/api/regions', (req, res) => {
  res.json({
    regions: [
      {
        id: 'benelux',
        name: 'Benelux',
        bounds: [[49.5, 2.5], [53.55, 7.23]],
        center: { lat: 51.5, lon: 4.9 },
        zoom: 7,
        description: 'Netherlands, Belgium, Luxembourg'
      },
      {
        id: 'netherlands',
        name: 'Netherlands', 
        bounds: [[50.75, 3.36], [53.55, 7.23]],
        center: { lat: 52.37, lon: 4.9 },
        zoom: 8,
        description: 'Netherlands only'
      },
      {
        id: 'belgium',
        name: 'Belgium',
        bounds: [[49.5, 2.5], [51.5, 6.4]],
        center: { lat: 50.5, lon: 4.5 },
        zoom: 8,
        description: 'Belgium only'
      },
      {
        id: 'germany',
        name: 'Germany',
        bounds: [[47.3, 5.9], [55.1, 15.0]],
        center: { lat: 51.2, lon: 10.4 },
        zoom: 6,
        description: 'Western Germany'
      }
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      'GET /health',
      'GET /api/regions',
      'POST /api/network/init',
      'GET /api/network/:id',
      'POST /api/network/:id/stations',
      'POST /api/network/:id/tracks',
      'DELETE /api/network/:id/stations/:stationId',
      'DELETE /api/network/:id/tracks/:trackId'
    ]
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    ...(NODE_ENV === 'development' && { stack: err.stack })
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
  GET  /api/regions         - Available map regions
  POST /api/network/*       - Network management
  POST /api/compute/*       - Computation APIs
  GET  /tiles/{z}/{x}/{y}.png - Static map tiles

Ready to build railways! 🚄
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