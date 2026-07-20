import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Router imports
import chatRouter from './api/chat';
import verseRouter from './api/verse';
import dictionaryRouter from './api/dictionary';
import imageRouter from './api/image';
import generatePlanRouter from './api/generate-plan';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware for JSON parsing
app.use(express.json());

// Register API Routes
app.use('/api/chat', chatRouter);
app.use('/api/verse', verseRouter);
app.use('/api/dictionary', dictionaryRouter);
app.use('/api/image', imageRouter);
app.use('/api/generate-plan', generatePlanRouter);

// Dummy endpoints for planner, user, and settings to ensure serverless route mapping
app.get('/api/planner', (req, res) => {
  res.json({ message: 'Planner endpoint pronto para conexão.' });
});
app.get('/api/user', (req, res) => {
  res.json({ message: 'User endpoint pronto para conexão.' });
});
app.get('/api/settings', (req, res) => {
  res.json({ message: 'Settings endpoint pronto para conexão.' });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Development mode with Vite Dev Middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Iniciado em modo DESENVOLVIMENTO com middleware do Vite.');
  } else {
    // Production mode serving static build
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Iniciado em modo PRODUÇÃO servindo arquivos estáticos.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Estudo Bíblico PRO rodando em http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Falha ao iniciar o servidor:', err);
});
