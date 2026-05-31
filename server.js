import express from 'express';
import compression from 'compression';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json());

// Serve static files from dist/public
const publicPath = join(__dirname, 'dist', 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

// API proxy - forward all /api requests to the backend
app.use('/api', async (req, res) => {
  try {
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;
    const url = new URL(req.originalUrl, backendUrl);
    
    const response = await fetch(url.toString(), {
      method: req.method,
      headers: {
        ...req.headers,
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();
    res.status(response.status);
    Object.entries(response.headers.raw()).forEach(([key, value]) => {
      res.set(key, value);
    });
    res.send(data);
  } catch (error) {
    console.error('API proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SPA fallback - serve index.html for all routes
app.get('*', (req, res) => {
  const indexPath = join(publicPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Serving static files from ${publicPath}`);
});
