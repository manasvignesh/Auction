import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { setupAuctionSocket } from './server/socket';

dotenv.config();

async function startServer() {
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });
  const PORT = 3000;

  app.use(express.json());

  // Setup Socket.io logic
  setupAuctionSocket(io);

  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // AI Verdict route — securely proxies to Google Gemini on the backend
  app.post('/api/ai-verdict', async (req, res) => {
    try {
      const { teams } = req.body;
      if (!teams || !Array.isArray(teams)) {
        return res.status(400).json({ error: 'Missing teams data' });
      }

      const apiKey = process.env.GOOGLE_GENAI_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GOOGLE_GENAI_KEY not configured' });
      }

      const genAI = new GoogleGenAI({ apiKey });
      const result = await genAI.models.generateContent({ 
        model: "gemini-1.5-flash",
        contents: prompt 
      });
      const verdict = result.text || 'The auction analytics system is temporarily offline.';
      
      res.json({ verdict });
    } catch (err) {
      console.error('AI verdict error:', err);
      res.json({ verdict: "The auction analytics system is temporarily offline — but one look at the squads tells you everything you need to know." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
