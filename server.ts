import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Serverless handler imports
import chatHandler from './api/chat';
import verseHandler from './api/verse';
import dictionaryHandler from './api/dictionary';
import imageHandler from './api/image';

const app = express();
const PORT = 3000;

// Middleware for JSON parsing
app.use(express.json());

// Serverless Express Adaptor
function makeExpressAdaptor(handler: any) {
  return async (req: express.Request, res: express.Response) => {
    const customReq = {
      method: req.method,
      query: req.query,
      body: req.body,
      headers: req.headers,
    };
    const customRes = {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code;
        res.status(code);
        return this;
      },
      json(data: any) {
        res.json(data);
        return this;
      },
      setHeader(name: string, value: any) {
        res.setHeader(name, value);
        return this;
      }
    };
    try {
      await handler(customReq, customRes);
    } catch (err) {
      console.error('Erro no adaptador serverless:', err);
      res.status(500).json({ error: 'Erro interno no processamento do adaptador.' });
    }
  };
}

// Register API Routes
app.post('/api/chat', makeExpressAdaptor(chatHandler));
app.get('/api/verse', makeExpressAdaptor(verseHandler));
app.get('/api/dictionary', makeExpressAdaptor(dictionaryHandler));
app.post('/api/image', makeExpressAdaptor(imageHandler));

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
