const express = require('express');
const cors = require('cors');
const fastRoutes = require('./fastRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use('/api', fastRoutes);

app.get('/', (req, res) => {
  res.send('Fast Tracker API is running.');
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Fast Tracker Express backend listening on http://localhost:${PORT}`);
});
