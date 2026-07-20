import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { BIBLE_BOOKS } from '../src/database/bibleMetadata';

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

// Predefined premium fallback plans for theological accuracy when offline/no key
function getOfflineFallbackPlan(theme: string): any {
  const query = theme.toLowerCase().trim();

  // 1. Soteriologia
  if (query.includes('soteriologia') || query.includes('salvação') || query.includes('graca') || query.includes('graça')) {
    return {
      title: 'Plano de Estudos em Soteriologia',
      description: 'Uma investigação profunda e sistemática de 30 dias sobre a doutrina da salvação, cobrindo a eleição, regeneração, justificação, santificação e glorificação à luz das Escrituras.',
      durationDays: 30,
      tasksPerDay: [
        { day: 1, title: 'Introdução à Soteriologia', readings: [{ bookId: 'ROM', bookName: 'Romanos', chapters: [1] }] },
        { day: 2, title: 'A Queda e a Depravação Humana', readings: [{ bookId: 'ROM', bookName: 'Romanos', chapters: [3] }] },
        { day: 3, title: 'A Gravidade do Pecado', readings: [{ bookId: 'EPH', bookName: 'Efésios', chapters: [2] }] },
        { day: 4, title: 'A Graça Comum e Especial', readings: [{ bookId: 'TIT', bookName: 'Tito', chapters: [2] }] },
        { day: 5, title: 'A Eleição Divina', readings: [{ bookId: 'EPH', bookName: 'Efésios', chapters: [1] }] },
        { day: 6, title: 'A Presciência de Deus', readings: [{ bookId: 'ROM', bookName: 'Romanos', chapters: [8] }] },
        { day: 7, title: 'O Chamado Eficaz', readings: [{ bookId: 'JOH', bookName: 'João', chapters: [6] }] },
        { day: 8, title: 'A Regeneração (Novo Nascimento)', readings: [{ bookId: 'JOH', bookName: 'João', chapters: [3] }] },
        { day: 9, title: 'O Arrependimento Teológico', readings: [{ bookId: '2COR', bookName: '2 Coríntios', chapters: [7] }] },
        { day: 10, title: 'A Fé Salvadora', readings: [{ bookId: 'EPH', bookName: 'Efésios', chapters: [2] }] },
        { day: 11, title: 'A Justificação pela Fé', readings: [{ bookId: 'ROM', bookName: 'Romanos', chapters: [5] }] },
        { day: 12, title: 'A Imputação da Justiça de Cristo', readings: [{ bookId: '2COR', bookName: '2 Coríntios', chapters: [5] }] },
        { day: 13, title: 'A Reconciliação com Deus', readings: [{ bookId: 'COL', bookName: 'Colossenses', chapters: [1] }] },
        { day: 14, title: 'A Adoção como Filhos de Deus', readings: [{ bookId: 'GAL', bookName: 'Gálatas', chapters: [4] }] },
        { day: 15, title: 'A União com Cristo', readings: [{ bookId: 'GAL', bookName: 'Gálatas', chapters: [2] }] },
        { day: 16, title: 'O Início da Santificação', readings: [{ bookId: 'ROM', bookName: 'Romanos', chapters: [6] }] },
        { day: 17, title: 'O Progresso na Santificação', readings: [{ bookId: 'PHI', bookName: 'Filipenses', chapters: [2] }] },
        { day: 18, title: 'A Perseverança dos Santos', readings: [{ bookId: 'JOH', bookName: 'João', chapters: [10] }] },
        { day: 19, title: 'A Segurança da Salvação', readings: [{ bookId: 'ROM', bookName: 'Romanos', chapters: [8] }] },
        { day: 20, title: 'A Glorificação Futura', readings: [{ bookId: '1COR', bookName: '1 Coríntios', chapters: [15] }] },
        { day: 21, title: 'A Expiação de Cristo', readings: [{ bookId: '1JOH', bookName: '1 João', chapters: [2] }] },
        { day: 22, title: 'A Graça Irresistível', readings: [{ bookId: 'JOH', bookName: 'João', chapters: [6] }] },
        { day: 23, title: 'A Ordem da Salvação (Ordo Salutis)', readings: [{ bookId: 'ROM', bookName: 'Romanos', chapters: [8] }] },
        { day: 24, title: 'A Salvação no Antigo Pacto', readings: [{ bookId: 'GEN', bookName: 'Gênesis', chapters: [15] }] },
        { day: 25, title: 'A Fé de Abraão', readings: [{ bookId: 'ROM', bookName: 'Romanos', chapters: [4] }] },
        { day: 26, title: 'A Nova Aliança em Cristo', readings: [{ bookId: 'HEB', bookName: 'Hebreus', chapters: [8] }] },
        { day: 27, title: 'A Obra do Espírito na Salvação', readings: [{ bookId: 'TIT', bookName: 'Tito', chapters: [3] }] },
        { day: 28, title: 'Fé e Boas Obras', readings: [{ bookId: 'JAS', bookName: 'Tiago', chapters: [2] }] },
        { day: 29, title: 'A Recompensa da Salvação', readings: [{ bookId: '2TIM', bookName: '2 Timóteo', chapters: [4] }] },
        { day: 30, title: 'Doxologia da Salvação', readings: [{ bookId: 'ROM', bookName: 'Romanos', chapters: [11] }] },
      ]
    };
  }

  // 2. Escatologia
  if (query.includes('escatologia') || query.includes('fim') || query.includes('apocalipse')) {
    return {
      title: 'Plano de Estudos em Escatologia Bíblica',
      description: 'Um roteiro sistemático de 30 dias para examinar as profecias bíblicas, o retorno de Cristo, o arrebatamento, o milênio, os julgamentos e os novos céus e nova terra.',
      durationDays: 30,
      tasksPerDay: [
        { day: 1, title: 'O Que é Escatologia?', readings: [{ bookId: 'MAT', bookName: 'Mateus', chapters: [24] }] },
        { day: 2, title: 'Sinais dos Tempos', readings: [{ bookId: 'LUC', bookName: 'Lucas', chapters: [21] }] },
        { day: 3, title: 'O Princípio das Dores', readings: [{ bookId: 'MAR', bookName: 'Marcos', chapters: [13] }] },
        { day: 4, title: 'A Grande Tribulação', readings: [{ bookId: 'MAT', bookName: 'Mateus', chapters: [24] }] },
        { day: 5, title: 'O Homem do Pecado (Anticristo)', readings: [{ bookId: '2THE', bookName: '2 Tessalonicenses', chapters: [2] }] },
        { day: 6, title: 'O Arrebatamento da Igreja', readings: [{ bookId: '1THE', bookName: '1 Tessalonicenses', chapters: [4] }] },
        { day: 7, title: 'O Tribunal de Cristo', readings: [{ bookId: '2COR', bookName: '2 Coríntios', chapters: [5] }] },
        { day: 8, title: 'As Bodas do Cordeiro', readings: [{ bookId: 'REV', bookName: 'Apocalipse', chapters: [19] }] },
        { day: 9, title: 'A Primeira Besta', readings: [{ bookId: 'REV', bookName: 'Apocalipse', chapters: [13] }] },
        { day: 10, title: 'O Falso Profeta', readings: [{ bookId: 'REV', bookName: 'Apocalipse', chapters: [13] }] },
        { day: 11, title: 'A Babilônia', readings: [{ bookId: 'REV', bookName: 'Apocalipse', chapters: [17] }] },
        { day: 12, title: 'A Queda da Babilônia', readings: [{ bookId: 'REV', bookName: 'Apocalipse', chapters: [18] }] },
        { day: 13, title: 'A Segunda Vinda de Cristo', readings: [{ bookId: 'REV', bookName: 'Apocalipse', chapters: [19] }] },
        { day: 14, title: 'A Batalha do Armagedom', readings: [{ bookId: 'REV', bookName: 'Apocalipse', chapters: [16] }] },
        { day: 15, title: 'A Prisão de Satanás', readings: [{ bookId: 'REV', bookName: 'Apocalipse', chapters: [20] }] },
        { day: 16, title: 'O Milênio', readings: [{ bookId: 'REV', bookName: 'Apocalipse', chapters: [20] }] },
        { day: 17, title: 'As Visões de Daniel', readings: [{ bookId: 'DAN', bookName: 'Daniel', chapters: [7] }] },
        { day: 18, title: 'As Setenta Semanas', readings: [{ bookId: 'DAN', bookName: 'Daniel', chapters: [9] }] },
        { day: 19, title: 'A Ressurreição Física', readings: [{ bookId: '1COR', bookName: '1 Coríntios', chapters: [15] }] },
        { day: 20, title: 'O Corpo Glorificado', readings: [{ bookId: '1COR', bookName: '1 Coríntios', chapters: [15] }] },
        { day: 21, title: 'O Grande Trono Branco', readings: [{ bookId: 'REV', bookName: 'Apocalipse', chapters: [20] }] },
        { day: 22, title: 'O Destino dos Ímpios', readings: [{ bookId: 'MAT', bookName: 'Mateus', chapters: [25] }] },
        { day: 23, title: 'Novos Céus e Nova Terra', readings: [{ bookId: 'REV', bookName: 'Apocalipse', chapters: [21] }] },
        { day: 24, title: 'A Nova Jerusalém', readings: [{ bookId: 'REV', bookName: 'Apocalipse', chapters: [21] }] },
        { day: 25, title: 'O Rio da Vida', readings: [{ bookId: 'REV', bookName: 'Apocalipse', chapters: [22] }] },
        { day: 26, title: 'O Estado Intermediário', readings: [{ bookId: 'PHI', bookName: 'Filipenses', chapters: [1] }] },
        { day: 27, title: 'Promessas aos Vencedores', readings: [{ bookId: 'REV', bookName: 'Apocalipse', chapters: [2] }] },
        { day: 28, title: 'A Restauração de Todas as Coisas', readings: [{ bookId: 'COL', bookName: 'Colossenses', chapters: [1] }] },
        { day: 29, title: 'Vivendo em Vigilância', readings: [{ bookId: '1THE', bookName: '1 Tessalonicenses', chapters: [5] }] },
        { day: 30, title: 'Maranata (Ora Vem, Senhor)', readings: [{ bookId: 'REV', bookName: 'Apocalipse', chapters: [22] }] },
      ]
    };
  }

  // 3. Generic Beautiful Custom Theological Fallback
  const formattedTheme = theme.charAt(0).toUpperCase() + theme.slice(1);
  const genericPlan: any = {
    title: `Plano de Estudos: ${formattedTheme}`,
    description: `Uma jornada de investigação bíblica profunda de 30 dias com foco em ${formattedTheme}, examinando passagens bíblicas centrais e suas implicações práticas.`,
    durationDays: 30,
    tasksPerDay: []
  };

  const booksCycle = [
    { id: 'JOH', name: 'João', chapter: 1 },
    { id: 'ROM', name: 'Romanos', chapter: 1 },
    { id: 'EPH', name: 'Efésios', chapter: 1 },
    { id: 'COL', name: 'Colossenses', chapter: 1 },
    { id: 'HEB', name: 'Hebreus', chapter: 1 },
    { id: 'GEN', name: 'Gênesis', chapter: 1 },
    { id: 'PSA', name: 'Salmos', chapter: 19 },
    { id: 'PRO', name: 'Provérbios', chapter: 1 },
    { id: 'ISA', name: 'Isaías', chapter: 9 },
    { id: 'ROM', name: 'Romanos', chapter: 8 },
  ];

  const topics = [
    'Fundamentos Bíblicos de [T]',
    'A Revelação Divina e [T]',
    'O Propósito Eterno em [T]',
    '[T] na Criação do Universo',
    'A Aliança e o Contexto de [T]',
    'A Lei de Deus e sua Conexão com [T]',
    'Adoração Prática e [T]',
    'Sabedoria Bíblica Associada a [T]',
    'Promessas Proféticas de [T]',
    'O Cumprimento Messias em [T]',
    '[T] nos Evangelhos Sinóticos',
    'A Proclamação do Reino e [T]',
    'O Testemunho dos Apóstolos de [T]',
    'Divindade e Mistério em [T]',
    'A Obra do Espírito Santo e [T]',
    'A Igreja Primitiva Impactada por [T]',
    'A Justificação por Fé e [T]',
    'Vida Vitoriosa em União com [T]',
    'A Sabedoria Transcendente de [T]',
    'A Supremacia de Cristo em [T]',
    'Graça Libertadora Relacionada a [T]',
    'Riquezas Espirituais Reveladas em [T]',
    'A Atitude de Servo Conectada a [T]',
    'A Centralidade na Cruz em [T]',
    'A Esperança Escatológica de [T]',
    'A Defesa da Sã Doutrina de [T]',
    'A Nova Aliança Firmada por [T]',
    'A Prática da Fé Produzida por [T]',
    'Chamado à Santificação por Causa de [T]',
    'Consumação Cósmica e Glória de [T]',
  ];

  for (let i = 1; i <= 30; i++) {
    const cycleIndex = (i - 1) % booksCycle.length;
    const bookInfo = booksCycle[cycleIndex];
    
    // Choose actual book details or modify slightly based on loop
    const book = BIBLE_BOOKS.find(b => b.id === bookInfo.id) || BIBLE_BOOKS[0];
    let ch = bookInfo.chapter + Math.floor((i - 1) / booksCycle.length);
    if (ch > book.chaptersCount) {
      ch = 1;
    }

    const rawTopic = topics[i - 1] || 'Estudo Sistemático de [T]';
    const dayTitle = rawTopic.replace(/\[T\]/g, formattedTheme);

    genericPlan.tasksPerDay.push({
      day: i,
      title: dayTitle,
      readings: [
        {
          bookId: book.id,
          bookName: book.name,
          chapters: [ch]
        }
      ]
    });
  }

  return genericPlan;
}

const router = Router();

router.post('/', async (req: any, res: any) => {

  const { theme } = req.body;

  if (!theme || typeof theme !== 'string' || theme.trim().length === 0) {
    return res.status(400).json({ error: 'O tema teológico é obrigatório.' });
  }

  const trimmedTheme = theme.trim();

  try {
    const ai = getAIClient();

    if (!ai) {
      console.log('API Key do Gemini ausente, gerando esboço com mecanismo local de alta fidelidade.');
      const fallback = getOfflineFallbackPlan(trimmedTheme);
      return res.status(200).json(fallback);
    }

    // Build the system prompt guiding Gemini to output valid structured JSON
    const prompt = `Você é o Assistente Teológico IA PRO, um erudito teólogo de nível doutoral especializado em Teologia Sistemática e Exegese Bíblica.
O usuário inseriu um tema teológico complexo: "${trimmedTheme}".
Seu objetivo é gerar automaticamente um plano estruturado de 30 dias de leitura e estudo para este tema.

Você DEVE retornar estritamente um objeto JSON com o formato abaixo. Não adicione textos fora do JSON, não coloque marcações adicionais que invalidem o JSON (retorne apenas o JSON limpo).

Esquema do JSON:
{
  "title": "Título elegante e erudito para o plano (ex: 'Soteriologia Bíblica: A Doutrina da Salvação')",
  "description": "Uma introdução/descrição resumida (máximo 200 caracteres) explicando a profundidade acadêmica deste plano de 30 dias.",
  "durationDays": 30,
  "tasksPerDay": [
    {
      "day": 1,
      "title": "Subtítulo de estudo do Dia 1 (ex: 'Introdução e Definição do Tema')",
      "readings": [
        {
          "bookId": "Código de 3 ou 4 letras maiúsculas do Livro Bíblico",
          "bookName": "Nome em português do Livro Bíblico",
          "chapters": [1]
        }
      ]
    }
  ]
}

REGRAS CRÍTICAS PARA OS LIVROS BÍBLICOS:
1. O campo "bookId" DEVE ser exatamente um destes IDs válidos de livros da Bíblia (em maiúsculas):
   [GEN, EXO, LEV, NUM, DEU, JOS, JUI, RUT, 1SAM, 2SAM, 1REI, 2REI, 1CRO, 2CRO, ESD, NEE, EST, JOB, PSA, PRO, ECC, SNG, ISA, JER, LAM, EZE, DAN, HOS, JOE, AMO, OBA, JON, MIC, NAH, HAB, ZEP, HAG, ZEC, MAL, MAT, MAR, LUC, JOH, ACT, ROM, 1COR, 2COR, GAL, EPH, PHI, COL, 1THE, 2THE, 1TIM, 2TIM, TIT, PHM, HEB, JAS, 1PET, 2PET, 1JOH, 2JOH, 3JOH, JUD, REV]
2. O campo "bookName" deve ser o nome correto em português (ex: "Gênesis" para GEN, "Romanos" para ROM, "Apocalipse" para REV).
3. Certifique-se de que o capítulo no campo "chapters" seja válido para aquele livro (ex: Romanos tem 16 capítulos, Efésios tem 6, etc.).
4. O plano DEVE conter exatamente 30 dias (do dia 1 ao dia 30).
5. O tema de estudo diário ("title") deve ter rigor acadêmico, correlacionando intimamente com a leitura sugerida para aquele dia e o tema geral "${trimmedTheme}".

Responda apenas com o JSON válido.`;

    const aiPromise = ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [prompt],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      }
    });

    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT_EXCEEDED')), 20000) // 20s timeout
    );

    const result: any = await Promise.race([aiPromise, timeoutPromise]);
    
    if (result && result.text) {
      let cleanedText = result.text.trim();
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '');
      }

      const parsedPlan = JSON.parse(cleanedText);

      // Validate structure before returning
      if (parsedPlan && parsedPlan.title && Array.isArray(parsedPlan.tasksPerDay) && parsedPlan.tasksPerDay.length > 0) {
        // Enforce basic standard structures just in case
        parsedPlan.durationDays = 30;
        parsedPlan.tasksPerDay = parsedPlan.tasksPerDay.map((task: any, index: number) => {
          const validatedReadings = (task.readings || []).map((r: any) => {
            // Find matched book in metadata to correct minor mismatches
            const cleanId = String(r.bookId || '').toUpperCase().trim();
            const matchedBook = BIBLE_BOOKS.find(b => b.id === cleanId || b.name.toLowerCase() === cleanId.toLowerCase());
            return {
              bookId: matchedBook ? matchedBook.id : 'ROM',
              bookName: matchedBook ? matchedBook.name : 'Romanos',
              chapters: Array.isArray(r.chapters) && r.chapters.length > 0 ? r.chapters.map((c: any) => parseInt(c, 10) || 1) : [1]
            };
          });

          return {
            day: parseInt(task.day, 10) || (index + 1),
            title: task.title || `Estudo Teológico - Dia ${index + 1}`,
            readings: validatedReadings.length > 0 ? validatedReadings : [{ bookId: 'ROM', bookName: 'Romanos', chapters: [1] }]
          };
        });

        // Slice to exactly 30 days if AI output differed
        if (parsedPlan.tasksPerDay.length > 30) {
          parsedPlan.tasksPerDay = parsedPlan.tasksPerDay.slice(0, 30);
        }

        console.log(`Plano gerado com sucesso via Gemini para o tema: "${trimmedTheme}"`);
        return res.status(200).json(parsedPlan);
      }
    }

    throw new Error('Falha na validação do JSON gerado');

  } catch (err: any) {
    console.warn('Erro ao processar plano teológico com IA, gerando fallback exegético local:', err.message || err);
    const fallback = getOfflineFallbackPlan(trimmedTheme);
    return res.status(200).json(fallback);
  }
});

export default router;
