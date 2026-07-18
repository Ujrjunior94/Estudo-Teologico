import { GoogleGenAI } from '@google/genai';
import { BIBLE_BOOKS, getChapterVersesCount, getGeneratedVerseText } from '../src/database/bibleMetadata';
import { DAILY_VERSES } from '../src/database/dailyVerses';

const bookIdToEnglishName: Record<string, string> = {
  GEN: 'Genesis',
  EXO: 'Exodus',
  LEV: 'Leviticus',
  NUM: 'Numbers',
  DEU: 'Deuteronomy',
  JOS: 'Joshua',
  JUI: 'Judges',
  RUT: 'Ruth',
  '1SAM': '1 Samuel',
  '2SAM': '2 Samuel',
  '1REI': '1 Kings',
  '2REI': '2 Kings',
  '1CRO': '1 Chronicles',
  '2CRO': '2 Chronicles',
  ESD: 'Ezra',
  NEE: 'Nehemiah',
  EST: 'Esther',
  JOB: 'Job',
  PSA: 'Psalms',
  PRO: 'Proverbs',
  ECC: 'Ecclesiastes',
  SNG: 'Song of Solomon',
  ISA: 'Isaiah',
  JER: 'Jeremiah',
  LAM: 'Lamentations',
  EZE: 'Ezekiel',
  DAN: 'Daniel',
  HOS: 'Hosea',
  JOE: 'Joel',
  AMO: 'Amos',
  OBA: 'Obadiah',
  JON: 'Jonah',
  MIC: 'Micah',
  NAH: 'Nahum',
  HAB: 'Habakkuk',
  ZEP: 'Zephaniah',
  HAG: 'Haggai',
  ZEC: 'Zechariah',
  MAL: 'Malachi',
  MAT: 'Matthew',
  MAR: 'Mark',
  LUC: 'Luke',
  JOH: 'John',
  ACT: 'Acts',
  ROM: 'Romans',
  '1COR': '1 Corinthians',
  '2COR': '2 Corinthians',
  GAL: 'Galatians',
  EPH: 'Ephesians',
  PHI: 'Philippians',
  COL: 'Colossians',
  '1THE': '1 Thessalonians',
  '2THE': '2 Thessalonians',
  '1TIM': '1 Timothy',
  '2TIM': '2 Timothy',
  TIT: 'Titus',
  PHM: 'Philemon',
  HEB: 'Hebrews',
  JAS: 'James',
  '1PET': '1 Peter',
  '2PET': '2 Peter',
  '1JOH': '1 John',
  '2JOH': '2 John',
  '3JOH': '3 John',
  JUD: 'Jude',
  REV: 'Revelation'
};

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

// Global in-memory cache to store full translation databases on the server side
const translationCaches: Record<string, any> = {};

async function getTranslationData(version: string) {
  const normalized = version.toUpperCase();
  if (translationCaches[normalized]) {
    return translationCaches[normalized];
  }

  let url = '';
  if (normalized === 'NVI') {
    url = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/pt_nvi.json';
  } else if (normalized === 'KJV') {
    url = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json';
  } else {
    // Default to ARA (loaded as pt_aa.json)
    url = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/pt_aa.json';
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout
    
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        translationCaches[normalized] = data;
        return data;
      }
    }
  } catch (err) {
    console.error(`Failed to fetch translation ${normalized} from primary URL:`, err);
  }

  // Fallback to pt_acf if pt_aa failed for ARA
  if (normalized === 'ARA') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const backupRes = await fetch('https://raw.githubusercontent.com/thiagobodruk/bible/master/json/pt_acf.json', { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (backupRes.ok) {
        const data = await backupRes.json();
        if (Array.isArray(data) && data.length > 0) {
          translationCaches[normalized] = data;
          return data;
        }
      }
    } catch (err) {
      console.error('Failed to fetch backup pt_acf from GitHub:', err);
    }
  }

  return null;
}

// Robustly find a book in GitHub translation database by matching abbreviation, name, and alternative aliases
function findBookInGithubData(bookId: string, githubData: any[]): any | null {
  const targetBook = BIBLE_BOOKS.find(b => b.id === bookId);
  if (!targetBook) return null;

  // Search by exact book name, abbreviation, or ID in various structures
  for (const entry of githubData) {
    if (!entry) continue;
    const entryName = String(entry.name || '').trim().toLowerCase();
    const entryAbbrev = String(entry.abbreviation || entry.abbrev || '').trim().toLowerCase();
    
    // Normalize targets
    const targetName = targetBook.name.toLowerCase();
    const targetAbbrev = targetBook.abbrev.toLowerCase();
    const targetId = bookId.toLowerCase();

    if (
      entryName === targetName ||
      entryAbbrev === targetAbbrev ||
      entryAbbrev === targetId ||
      entryName === targetId ||
      // Alternative common Portuguese matches
      (targetId === 'gen' && (entryName === 'gênesis' || entryAbbrev === 'gn')) ||
      (targetId === 'exo' && (entryName === 'êxodo' || entryAbbrev === 'êx' || entryAbbrev === 'ex')) ||
      (targetId === 'lev' && (entryName === 'levítico' || entryAbbrev === 'lv')) ||
      (targetId === 'num' && (entryName === 'números' || entryAbbrev === 'nm')) ||
      (targetId === 'deu' && (entryName === 'deuteronômio' || entryAbbrev === 'dt')) ||
      (targetId === 'jos' && (entryName === 'josué' || entryAbbrev === 'js')) ||
      (targetId === 'jdg' && (entryName === 'juízes' || entryAbbrev === 'jz')) ||
      (targetId === 'rut' && (entryName === 'rute' || entryAbbrev === 'rt')) ||
      (targetId === '1sa' && (entryName === '1 samuel' || entryAbbrev === '1sm')) ||
      (targetId === '2sa' && (entryName === '2 samuel' || entryAbbrev === '2sm')) ||
      (targetId === '1ki' && (entryName === '1 reis' || entryAbbrev === '1re')) ||
      (targetId === '2ki' && (entryName === '2 reis' || entryAbbrev === '2re')) ||
      (targetId === '1ch' && (entryName === '1 crônicas' || entryAbbrev === '1cr')) ||
      (targetId === '2ch' && (entryName === '2 crônicas' || entryAbbrev === '2cr')) ||
      (targetId === 'ezr' && (entryName === 'esdras' || entryAbbrev === 'ez')) ||
      (targetId === 'neh' && (entryName === 'neemias' || entryAbbrev === 'ne')) ||
      (targetId === 'est' && (entryName === 'ester' || entryAbbrev === 'et')) ||
      (targetId === 'job' && (entryName === 'jó' || entryAbbrev === 'jó')) ||
      (targetId === 'psa' && (entryName === 'salmos' || entryAbbrev === 'sl')) ||
      (targetId === 'pro' && (entryName === 'provérbios' || entryAbbrev === 'pv')) ||
      (targetId === 'ecc' && (entryName === 'eclesiastes' || entryAbbrev === 'ec')) ||
      (targetId === 'sng' && (entryName === 'cantares' || entryName === 'cântico dos cânticos' || entryAbbrev === 'ct')) ||
      (targetId === 'isa' && (entryName === 'isaías' || entryAbbrev === 'is')) ||
      (targetId === 'jer' && (entryName === 'jeremias' || entryAbbrev === 'jr')) ||
      (targetId === 'lam' && (entryName === 'lamentações' || entryAbbrev === 'lm')) ||
      (targetId === 'ezk' && (entryName === 'ezequiel' || entryAbbrev === 'ez')) ||
      (targetId === 'dan' && (entryName === 'daniel' || entryAbbrev === 'dn')) ||
      (targetId === 'hos' && (entryName === 'oseias' || entryAbbrev === 'os')) ||
      (targetId === 'jol' && (entryName === 'joel' || entryAbbrev === 'jl')) ||
      (targetId === 'amo' && (entryName === 'amós' || entryAbbrev === 'am')) ||
      (targetId === 'oba' && (entryName === 'obadias' || entryAbbrev === 'ob')) ||
      (targetId === 'jon' && (entryName === 'jonas' || entryAbbrev === 'jn')) ||
      (targetId === 'mic' && (entryName === 'miqueias' || entryAbbrev === 'mq')) ||
      (targetId === 'nah' && (entryName === 'naum' || entryAbbrev === 'na')) ||
      (targetId === 'hab' && (entryName === 'habacuque' || entryAbbrev === 'hc')) ||
      (targetId === 'zep' && (entryName === 'sofonias' || entryAbbrev === 'sf')) ||
      (targetId === 'hag' && (entryName === 'ageu' || entryAbbrev === 'ag')) ||
      (targetId === 'zec' && (entryName === 'zacarias' || entryAbbrev === 'zc')) ||
      (targetId === 'mal' && (entryName === 'malaquias' || entryAbbrev === 'ml')) ||
      (targetId === 'mat' && (entryName === 'mateus' || entryAbbrev === 'mt')) ||
      (targetId === 'mrk' && (entryName === 'marcos' || entryAbbrev === 'mc')) ||
      (targetId === 'luk' && (entryName === 'lucas' || entryAbbrev === 'lc')) ||
      (targetId === 'joh' && (entryName === 'joão' || entryAbbrev === 'jo')) ||
      (targetId === 'act' && (entryName === 'atos' || entryAbbrev === 'at')) ||
      (targetId === 'rom' && (entryName === 'romanos' || entryAbbrev === 'rm')) ||
      (targetId === '1co' && (entryName === '1 coríntios' || entryAbbrev === '1co')) ||
      (targetId === '2co' && (entryName === '2 coríntios' || entryAbbrev === '2co')) ||
      (targetId === 'gal' && (entryName === 'gálatas' || entryAbbrev === 'gl')) ||
      (targetId === 'eph' && (entryName === 'efésios' || entryAbbrev === 'ef')) ||
      (targetId === 'php' && (entryName === 'filipenses' || entryAbbrev === 'fp')) ||
      (targetId === 'col' && (entryName === 'colossenses' || entryAbbrev === 'cl')) ||
      (targetId === '1th' && (entryName === '1 tessalonicenses' || entryAbbrev === '1ts')) ||
      (targetId === '2th' && (entryName === '2 tessalonicenses' || entryAbbrev === '2ts')) ||
      (targetId === '1ti' && (entryName === '1 timóteo' || entryAbbrev === '1tm')) ||
      (targetId === '2ti' && (entryName === '2 timóteo' || entryAbbrev === '2tm')) ||
      (targetId === 'tit' && (entryName === 'tito' || entryAbbrev === 'tt')) ||
      (targetId === 'phm' && (entryName === 'filemom' || entryAbbrev === 'fm')) ||
      (targetId === 'heb' && (entryName === 'hebreus' || entryAbbrev === 'hb')) ||
      (targetId === 'jas' && (entryName === 'tiago' || entryAbbrev === 'tg')) ||
      (targetId === '1pe' && (entryName === '1 pedro' || entryAbbrev === '1pe')) ||
      (targetId === '2pe' && (entryName === '2 pedro' || entryAbbrev === '2pe')) ||
      (targetId === '1jo' && (entryName === '1 joão' || entryAbbrev === '1jo')) ||
      (targetId === '2jo' && (entryName === '2 joão' || entryAbbrev === '2jo')) ||
      (targetId === '3jo' && (entryName === '3 joão' || entryAbbrev === '3jo')) ||
      (targetId === 'jud' && (entryName === 'judas' || entryAbbrev === 'jd')) ||
      (targetId === 'rev' && (entryName === 'apocalipse' || entryAbbrev === 'ap'))
    ) {
      return entry;
    }
  }

  // Fallback to searching if name contains or matches
  for (const entry of githubData) {
    if (!entry) continue;
    const entryName = String(entry.name || '').trim().toLowerCase();
    const targetName = targetBook.name.toLowerCase();
    if (entryName.includes(targetName) || targetName.includes(entryName)) {
      return entry;
    }
  }

  return null;
}

export default async function handler(req: any, res: any) {
  const { bookId, chapter, version } = req.query;

  if (!bookId || !chapter) {
    return res.status(400).json({ error: 'Parâmetros "bookId" e "chapter" são obrigatórios.' });
  }

  const book = BIBLE_BOOKS.find(b => b.id === bookId.toUpperCase());
  if (!book) {
    return res.status(404).json({ error: 'Livro não encontrado.' });
  }

  const chNum = parseInt(chapter, 10);
  if (isNaN(chNum) || chNum < 1 || chNum > book.chaptersCount) {
    return res.status(400).json({ error: `Capítulo inválido. O livro ${book.name} possui ${book.chaptersCount} capítulos.` });
  }

  const activeVersion = version || 'ARA';
  
  let fetchedVerses: { verse: number; text: string }[] | null = null;
  let responseSource: 'api' | 'synthetic' = 'api';

  // 1. Try high-fidelity, verified database fetch from GitHub (extremely fast & 100% accurate)
  try {
    const githubData = await getTranslationData(activeVersion);
    if (githubData && Array.isArray(githubData)) {
      const bookData = findBookInGithubData(book.id, githubData);
      if (bookData && Array.isArray(bookData.chapters)) {
        const chapterData = bookData.chapters[chNum - 1];
        if (Array.isArray(chapterData)) {
          fetchedVerses = chapterData.map((text: string, idx: number) => ({
            verse: idx + 1,
            text: String(text || '').trim()
          })).filter((v: any) => v.text.length > 0);
          console.log(`Successfully fetched authentic scripture for ${book.name} ${chNum} (${activeVersion}) from GitHub database!`);
        }
      }
    }
  } catch (err) {
    console.warn('Could not fetch authentic verses from GitHub database. Trying Gemini:', err);
  }

  // 2. Try fetching the authentic chapter verses via Gemini if the API key is active
  if (!fetchedVerses || fetchedVerses.length === 0) {
    const ai = getAIClient();
    if (ai) {
      try {
        const prompt = `Você é um servidor de API bíblica ultra-fiel. Forneça o texto integral e exato de todos os versículos do capítulo: livro "${book.name}" (ID: ${book.id}), capítulo ${chNum}, na tradução/versão brasileira ou inglesa: "${activeVersion}" (ARA = Almeida Revista e Atualizada, NVI = Nova Versão Internacional, KJV = King James Version).
Retorne o resultado estritamente no formato JSON abaixo, contendo um único atributo "verses" que é uma lista de objetos, cada um com os campos "verse" (número do versículo como inteiro) e "text" (o texto fiel do versículo na versão solicitada).
Por favor, retorne TODOS os versículos do capítulo, do versículo 1 até o último versículo (não omita, não resuma, não use reticências e garanta a fidelidade ao texto bíblico real).
Exemplo de formato:
{
  "verses": [
    { "verse": 1, "text": "No princípio..." }
  ]
}
Responda apenas com o JSON válido.`;

        const aiPromise = ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: [prompt],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          }
        });

        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), 10000)
        );

        const result: any = await Promise.race([aiPromise, timeoutPromise]);
        if (result && result.text) {
          let cleanedText = result.text.trim();
          if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '');
          }
          
          const parsed = JSON.parse(cleanedText);
          if (parsed && Array.isArray(parsed.verses) && parsed.verses.length > 0) {
            fetchedVerses = parsed.verses.map((v: any) => ({
              verse: parseInt(v.verse, 10) || v.v || 0,
              text: String(v.text || v.t || '').trim()
            })).filter((v: any) => v.verse > 0 && v.text.length > 0);
            console.log(`Successfully fetched authentic scripture for ${book.name} ${chNum} (${activeVersion}) via Gemini.`);
          }
        }
      } catch (err) {
        console.warn('Could not fetch authentic verses via Gemini. Falling back to public API:', err);
      }
    }
  }

  // 3. Robust Fallback: if Gemini fails or is offline, try fetching from the free public bible-api.com
  if (!fetchedVerses || fetchedVerses.length === 0) {
    try {
      const englishBookName = bookIdToEnglishName[book.id];
      if (englishBookName) {
        const translationParam = activeVersion === 'KJV' ? 'kjv' : 'almeida';
        const url = `https://bible-api.com/${encodeURIComponent(englishBookName)}+${chNum}?translation=${translationParam}`;
        
        console.log(`Gemini/GitHub failed or skipped. Querying backup Bible API: ${url}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data: any = await response.json();
          if (data && Array.isArray(data.verses) && data.verses.length > 0) {
            fetchedVerses = data.verses.map((v: any) => ({
              verse: parseInt(v.verse, 10) || 0,
              text: String(v.text || '').trim()
            })).filter((v: any) => v.verse > 0 && v.text.length > 0);
            console.log(`Successfully fetched authentic scripture for ${book.name} ${chNum} via backup Bible API.`);
          }
        }
      }
    } catch (apiErr) {
      console.warn('Backup Bible API also failed:', apiErr);
    }
  }

  // 4. Local Synthetic Fallback (as absolute last resort if completely offline and not cached)
  if (!fetchedVerses || fetchedVerses.length === 0) {
    responseSource = 'synthetic';
    const verseCount = getChapterVersesCount(book.id, chNum);
    fetchedVerses = [];
    for (let v = 1; v <= verseCount; v++) {
      fetchedVerses.push({
        verse: v,
        text: getGeneratedVerseText(book.id, chNum, v, activeVersion)
      });
    }
  }

  return res.status(200).json({
    bookId: book.id,
    bookName: book.name,
    chapter: chNum,
    version: activeVersion,
    verses: fetchedVerses,
    source: responseSource
  });
}
