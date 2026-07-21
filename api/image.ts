import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let body = req.body;
  if (typeof body === 'string' && body.trim().length > 0) {
    try {
      body = JSON.parse(body);
    } catch {
      // Keep original body
    }
  }

  const { prompt, aspectRatio } = body || {};

  if (!prompt) {
    return res.status(400).json({ error: 'Parâmetro "prompt" é obrigatório.' });
  }

  const ai = getAIClient();
  if (!ai) {
    return res.status(401).json({
      error: 'Serviço offline ou Chave de API indisponível.',
      code: 'API_KEY_MISSING',
      message: 'Insira a chave do Gemini em Configurações para habilitar a geração artística por IA.'
    });
  }

  try {
    const finalPrompt = `Estilo de pintura teológica clássica, arte sagrada, alta definição, sem textos na imagem, focado no tema: ${prompt}`;
    
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: finalPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: aspectRatio || '16:9'
      }
    });

    let base64Image = '';
    if (response.generatedImages && response.generatedImages[0] && response.generatedImages[0].image) {
      base64Image = response.generatedImages[0].image.imageBytes;
    }

    if (!base64Image) {
      throw new Error('Não foi possível extrair a imagem gerada da resposta do modelo Imagen.');
    }

    return res.status(200).json({
      imageUrl: `data:image/png;base64,${base64Image}`
    });

  } catch (err: any) {
    console.error('Erro na geração de arte por IA:', err);
    
    // Friendly, user-safe Portuguese messages depending on the error type
    let friendlyMessage = 'Serviço temporariamente indisponível. Por favor, tente novamente mais tarde.';
    const errorString = String(err).toLowerCase();
    
    if (errorString.includes('quota') || errorString.includes('limit') || errorString.includes('exhausted')) {
      friendlyMessage = 'O limite diário de geração de imagens com inteligência artificial foi atingido. Por favor, tente novamente amanhã.';
    } else if (errorString.includes('key') || errorString.includes('unauthorized') || errorString.includes('not found')) {
      friendlyMessage = 'A chave da API fornecida parece inválida ou não tem permissão para usar o modelo de imagens.';
    } else if (errorString.includes('safety') || errorString.includes('blocked')) {
      friendlyMessage = 'A imagem solicitada não pôde ser gerada devido aos filtros de segurança e sensibilidade do modelo.';
    } else if (errorString.includes('timeout')) {
      friendlyMessage = 'O servidor demorou muito para responder. Verifique sua conexão de rede e tente novamente.';
    }

    return res.status(500).json({
      error: 'Falha ao gerar arte teológica por IA.',
      message: friendlyMessage
    });
  }
}
