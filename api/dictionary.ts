import { DICTIONARY_TERMS, searchDictionaryTerms } from '../src/database/dictionaryData';
import { GoogleGenAI, Type } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null; // fallback gracefully if key is missing or not configured
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
  const { query, word } = req.query;

  // Single word lookup (exact details)
  if (word) {
    const cleanWord = word.trim().toLowerCase();
    const localTerm = DICTIONARY_TERMS.find(
      t => t.term.toLowerCase() === cleanWord || t.id === cleanWord
    );

    if (localTerm) {
      return res.status(200).json(localTerm);
    }

    // AI Fallback for the dictionary
    const ai = getAIClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: `Forneça os detalhes teológicos acadêmicos para a palavra: "${word}".`,
          config: {
            systemInstruction: `Você é um dicionário teológico exaustivo. Responda em formato JSON válido que siga o seguinte esquema exato:
{
  "term": "Termo Procurado (Exato)",
  "etymology": "Etimologia grega, hebraica ou latina com termos originais transliterados",
  "category": "Escolha uma: Teologia Sistemática, Soteriologia, Metodologia, Teologia Própria, Teologia Prática, Histórica",
  "definition": "Definição clara, formal e enciclopédica do termo",
  "theologicalPerspective": "Perspectiva teológica detalhada nas tradições ortodoxas e reformadas",
  "biblicalReferences": ["Livro Capítulo:Versículo", "Outro Livro Cap:Ver"]
}`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                term: { type: Type.STRING },
                etymology: { type: Type.STRING },
                category: { type: Type.STRING },
                definition: { type: Type.STRING },
                theologicalPerspective: { type: Type.STRING },
                biblicalReferences: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ['term', 'etymology', 'category', 'definition', 'theologicalPerspective', 'biblicalReferences']
            }
          }
        });

        const data = JSON.parse(response.text.trim());
        const termResult = {
          id: word.toLowerCase().replace(/[^a-z]/g, ''),
          ...data
        };
        return res.status(200).json(termResult);
      } catch (err) {
        console.error('Erro na expansão de termo com IA:', err);
      }
    }

    return res.status(404).json({ error: 'Termo teológico não encontrado offline e serviço de IA indisponível.' });
  }

  // Multi-term searching
  const searchQuery = query || '';
  const results = searchDictionaryTerms(searchQuery);

  return res.status(200).json({
    query: searchQuery,
    count: results.length,
    results
  });
}
