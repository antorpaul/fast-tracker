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

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

app.use(express.json());
app.use('/api', fastRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Fast Tracker API is running.', version: '0.1.0' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// For Vercel deployment: export as default
// For local development: start server if not imported
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Fast Tracker Express backend listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
