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
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, aspectRatio } = req.body;

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
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [
          {
            text: finalPrompt
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio || '16:9'
        }
      }
    });

    let base64Image = '';
    const candidates = response.candidates;
    if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          base64Image = part.inlineData.data;
          break;
        }
      }
    }

    if (!base64Image) {
      throw new Error('Não foi possível extrair a imagem gerada da resposta do modelo.');
    }

    return res.status(200).json({
      imageUrl: `data:image/png;base64,${base64Image}`
    });

  } catch (err: any) {
    console.error('Erro na geração de arte por IA:', err);
    return res.status(500).json({
      error: 'Falha ao gerar arte teológica por IA.',
      message: err.message || 'Erro inesperado na geração do ativo.'
    });
  }
}
