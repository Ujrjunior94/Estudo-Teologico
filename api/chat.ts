import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('API_KEY_MISSING');
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

// Serverless Handler interface matching Vercel/Netlify standard
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { messages, option } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Parâmetro "messages" inválido ou ausente.' });
  }

  try {
    const ai = getAIClient();

    // Map system instructions based on theological tools selected (exegese, hermeneutica, devocional, mapa mental)
    let systemInstruction = `Você é o Assistente Teológico IA PRO, um erudito teológico altamente capacitado em línguas originais (hebraico, aramaico, grego), história eclesiástica, arqueologia bíblica e exegese sistemática.
Seu objetivo é ajudar o usuário a estudar a Bíblia com profundidade acadêmica e sensibilidade espiritual.
Sempre forneça respostas estruturadas em Markdown, ricas em referências bíblicas e com insights teológicos históricos.`;

    if (option === 'exegese') {
      systemInstruction += `\nFoco: EXEGESE TEXTUAL. Analise os termos originais (grego/hebraico), a estrutura gramatical, as variantes textuais e o contexto imediato e histórico do texto bíblico inserido.`;
    } else if (option === 'hermeneutica') {
      systemInstruction += `\nFoco: HERMENÊUTICA. Mostre a aplicação contemporânea do texto a partir de seu sentido original, analisando princípios teológicos duradouros e evitando eisegese.`;
    } else if (option === 'devocional') {
      systemInstruction += `\nFoco: DEVOCIONAL E ORAÇÃO. Produza reflexões espirituais profundas, orações sugeridas baseadas no texto e passos de aplicação prática para o cotidiano.`;
    } else if (option === 'mapa_mental') {
      systemInstruction += `\nFoco: MAPA MENTAL TEXTUAL. Estruture sua resposta como um mapa mental detalhado em formato Markdown (com tópicos, sub-tópicos e ramificações claras) para facilitar a memorização e ensino do tema.`;
    }

    const contents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    // Implement a simple race condition to support timeouts
    const aiPromise = ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT_EXCEEDED')), 20000) // 20s timeout
    );

    const result: any = await Promise.race([aiPromise, timeoutPromise]);
    const text = result.text;

    return res.status(200).json({ text });

  } catch (err: any) {
    console.error('Erro no processamento da IA:', err);

    if (err.message === 'API_KEY_MISSING') {
      return res.status(401).json({
        error: 'Chave de API inválida ou não configurada.',
        code: 'INVALID_API_KEY',
        message: 'A chave da API do Gemini não foi encontrada no painel Secrets.'
      });
    }

    if (err.message === 'TIMEOUT_EXCEEDED') {
      return res.status(504).json({
        error: 'Tempo limite esgotado.',
        code: 'TIMEOUT',
        message: 'A resposta do Gemini demorou mais de 20 segundos. Por favor, tente novamente.'
      });
    }

    // Capture standard API limits and status codes
    const errorString = String(err).toLowerCase();
    if (errorString.includes('quota') || errorString.includes('limit') || errorString.includes('exhausted')) {
      return res.status(429).json({
        error: 'Limite de requisições excedido.',
        code: 'QUOTA_EXCEEDED',
        message: 'Você atingiu o limite de cota temporária. Por favor, aguarde alguns minutos e tente novamente.'
      });
    }

    if (errorString.includes('key') || errorString.includes('api key') || errorString.includes('unauthorized')) {
      return res.status(401).json({
        error: 'Chave de API inválida.',
        code: 'INVALID_API_KEY',
        message: 'A chave da API inserida no servidor é inválida ou expirou.'
      });
    }

    // Fallback: Check if offline / network error from node fetch
    if (errorString.includes('enotfound') || errorString.includes('fetch failed')) {
      return res.status(503).json({
        error: 'Erro de conexão.',
        code: 'NO_INTERNET',
        message: 'Servidor temporariamente incapaz de conectar à internet para falar com o Gemini.'
      });
    }

    return res.status(500).json({
      error: 'Erro interno no processamento do assistente.',
      code: 'INTERNAL_ERROR',
      message: err.message || 'Houve uma falha interna na comunicação com o modelo de inteligência artificial.'
    });
  }
}
