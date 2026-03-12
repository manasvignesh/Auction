import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
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

  // AI Verdict route — securely proxies to Anthropic on the backend
  app.post('/api/ai-verdict', async (req, res) => {
    try {
      const { teams } = req.body;
      if (!teams || !Array.isArray(teams)) {
        return res.status(400).json({ error: 'Missing teams data' });
      }

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
      }

      const anthropic = new Anthropic({ apiKey });

      const prompt = `You are the legendary cricket commentator Harsha Bhogle. You just witnessed a high-stakes IPL Franchise Auction. Here are the final results for all teams:\n\n${teams.map((t: any) => `${t.rank}. ${t.name} (${t.city}) — Score: ${t.score}/100, ₹${t.budgetLeft}Cr left\n   Squad: ${t.players}`).join('\n\n')}\n\nPlease write a witty, insightful, and slightly poetic post-auction summary in exactly 3 paragraphs. Use your signature "Harsha" style — mix profound tactical observations with a genuine love for the game's unpredictability. Mention the winner and one standout squad-building strategy you noticed. Return ONLY the text of the analysis.`;

      const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      });

      const verdict = msg.content[0].type === 'text' ? msg.content[0].text : 'The auction analytics system is temporarily offline.';
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
