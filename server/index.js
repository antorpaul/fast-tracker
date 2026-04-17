const express = require('express');
const cors = require('cors');
const fastRoutes = require('./fastRoutes');

const app = express();

// CORS configuration: allow frontend domain(s) in production and localhost in development
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
].filter(Boolean);

console.log('[STARTUP] Allowed origins for CORS:', allowedOrigins);
console.log('[STARTUP] FRONTEND_URL env var:', process.env.FRONTEND_URL);

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.path} from origin: ${req.get('origin')}`);
  next();
});

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

// Log after CORS middleware
app.use((req, res, next) => {
  console.log(`[CORS] Response headers set for ${req.method} ${req.path}`);
  next();
});

app.use(express.json());
app.use('/api', fastRoutes);

app.get('/', (req, res) => {
  console.log('[ROUTE] GET / - health check');
  res.json({ message: 'Fast Tracker API is running.', version: '0.1.0' });
});

app.get('/health', (req, res) => {
  console.log('[ROUTE] GET /health - health check');
  res.json({ status: 'ok' });
});

app.use((req, res) => {
  console.error(`[ERROR] 404 - ${req.method} ${req.path} not found`);
  res.status(404).json({ error: 'Not found' });
});

// For Vercel deployment: export as default
// For local development: start server if not imported
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`[STARTUP] Fast Tracker Express backend listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
