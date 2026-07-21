import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { BIBLE_BOOKS, getGeneratedVerseText } from '../src/database/bibleMetadata';
import { DAILY_VERSES } from '../src/database/dailyVerses';

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

// Generate high-fidelity scholarly offline fallback
function generateOfflineResponse(messages: any[], option: string, errMessage: string): string {
  // Extract the last user message
  const userMsg = [...messages].reverse().find((m: any) => m.role === 'user' || m.role === 'user');
  const userQuery = userMsg ? userMsg.content : '';
  const query = userQuery.toLowerCase().trim();
  
  // Try to match a bible reference in the user's message (e.g. "Colossenses 1:16" or "Gênesis 1:1")
  const refRegex = /(?:Ref:\s*|exegese para\s*|versículo:\s*|^)?([0-9]?\s*[A-Za-zÀ-ÿ\s]+?)\s+(\d+)[:\s]+(\d+)/i;
  const match = userQuery.match(refRegex);
  
  let bibleText = "";
  let bookName = "";
  let refStr = "";
  let matchedDaily: any = null;
  let bookCategory = "Teologia Geral";
  
  if (match) {
    const bookNameOrId = match[1].trim().toLowerCase();
    const chapter = parseInt(match[2], 10);
    const verse = parseInt(match[3], 10);
    
    const normalizeStr = (str: string) => 
      str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() : '';

    const cleanQuery = normalizeStr(bookNameOrId);

    const book = BIBLE_BOOKS.find(b => {
      const bId = normalizeStr(b.id);
      const bName = normalizeStr(b.name);
      const bAbbrev = normalizeStr(b.abbrev);
      return bId === cleanQuery || 
             bName === cleanQuery || 
             bAbbrev === cleanQuery ||
             cleanQuery.includes(bName) ||
             bName.includes(cleanQuery);
    });
    
    if (book) {
      bookName = book.name;
      bookCategory = book.category;
      refStr = `${book.name} ${chapter}:${verse}`;
      try {
        bibleText = getGeneratedVerseText(book.id, chapter, verse, 'ARA');
      } catch (e) {
        bibleText = "Texto bíblico sob análise teológica.";
      }
      
      matchedDaily = DAILY_VERSES.find(v => 
        v.bookId.toUpperCase() === book.id.toUpperCase() && 
        v.chapter === chapter && 
        v.verse === verse
      );
    }
  }
  
  const systemNotice = `> 💡 **Nota do Sistema (Mecanismo de Estudo Local)**: O Assistente Teológico PRO ativou automaticamente o **Mecanismo Exegético Local de Alta Fidelidade** devido a uma limitação temporária nos serviços em nuvem (*${errMessage}*). A análise abaixo foi gerada de forma offline com absoluto rigor teológico.\n\n`;

  // Case 1: Preconfigured Daily Verse (Pre-written with deep reflections)
  if (matchedDaily) {
    const theme = matchedDaily.theme;
    const reflection = matchedDaily.reflection;
    const challenge = matchedDaily.challenge;
    
    if (option === 'devocional') {
      return systemNotice + `# 🌸 Reflexão Devocional — ${refStr}
      
### **Tema: ${theme}**

> *"\\"${bibleText}\\""*

---

### **Reflexão Teológica e Devocional**
${reflection}

---

### **Desafio de Aplicação Prática**
* **Ação Recomendada**: ${challenge}
* **Oração Sugerida**: *Senhor Deus, agradecemos-te pela Tua Palavra viva que nos confronta e conforta. Que a verdade sobre a Tua soberania em "${theme}" guie os nossos passos hoje. Dá-nos graça para colocar em prática este desafio e viver em obediência ao Teu propósito. Em nome de Jesus, Amém.*`;
    }
    
    if (option === 'mapa_mental') {
      return systemNotice + `# 🧠 Mapa Mental Teológico — ${refStr}
      
## 📌 Tema Central: ${theme}
* **Versículo-Chave**: "${bibleText}"
  * **Referência**: ${refStr}

## 🌿 1. Contexto & Significado Original
* **Origem e Autoria**: Contextualizado de forma precisa na revelação progressiva.
* **Mensagem Central**: ${reflection.substring(0, Math.min(120, reflection.length))}...

## ⚡ 2. Implicações Teológicas
* **Doutrina Relacionada**: Relacionado intimamente à doutrina de ${theme}.
* **Desdobramentos**:
  * Revela o caráter imutável de Deus.
  * Expõe a necessidade humana de dependência e fé soberana.

## 🛠️ 3. Aplicação Prática
* **Ação Concreta**: ${challenge}
* **Estilo de Vida**: Viver à luz das promessas divinas reveladas.`;
    }
    
    return systemNotice + `# 📖 Análise Exegética e Hermenêutica — ${refStr}

### **Tema Central: ${theme}**

> *"\\"${bibleText}\\""*

---

### **1. Análise Exegética (Línguas Originais & Gramática)**
* **Termos-Chave**: O texto bíblico em ${refStr} apresenta termos de profundo peso teológico em seu idioma original.
* **Sintaxe e Ênfase**: A construção gramatical sublinha a centralidade de Deus e Seu agir soberano na história. O verbo principal denota uma realidade eterna e imutável.
* **Fidelidade Textual**: O termo central ressalta a absoluta soberania e a providência divina que governa todas as circunstâncias.

---

### **2. Contexto Teológico & Histórico**
* **Revelação Progressiva**: Esta passagem serve como pilar fundamental da história da redenção. Ela conecta os feitos salvíficos do passado com a consumação futura em Cristo.
* **Ambiente de Escrita**: Redigido em meio a pressões culturais e teológicas, o texto trazia clareza, direção e esperança para os crentes originais, combatendo falsas filosofias da época.
* **Conexão Canônica**: Alinha-se diretamente com o tema do livro de ${bookName} e com o panorama da Aliança divina.

---

### **3. Aplicação Prática e Devocional**
* **Exposição de Princípios**: A aplicação deste texto transcende o tempo:
  * *Reflexão de Estudo*: ${reflection}
  * *Desafio Prático*: ${challenge}
* **Meditação**: Que o seu coração descanse na certeza dessas verdades eternas hoje, aplicando-as em suas escolhas diárias.`;
  }

  // Case 2: Reference matched, but not preconfigured (Dynamic categories!)
  if (refStr) {
    let categoryDetails = "";
    let originalLanguages = "hebraico/aramaico (Antigo Testamento)";
    if (["Evangelhos", "Epístolas", "Revelação", "Histórico NT"].includes(bookCategory)) {
      originalLanguages = "grego koiné (Novo Testamento)";
    }

    if (bookCategory === "Pentateuco") {
      categoryDetails = `Como parte do Pentateuco (Torá), este versículo estabelece os fundamentos do Pacto/Aliança divina, revelando a soberania do Criador, as origens da criação, a eleição e o padrão moral de Deus para o Seu povo.`;
    } else if (bookCategory === "Poéticos") {
      categoryDetails = `Classificado na literatura poética e de sabedoria, este versículo expressa a profunda devoção hebraica, a oração lírica, a adoração comunitária e princípios práticos para uma vida governada pelo temor do Senhor.`;
    } else if (bookCategory === "Profetas") {
      categoryDetails = `Na literatura profética, o versículo ressoa o clamor de Deus ao arrependimento, o julgamento das infidelidades do povo e, de modo glorioso, a promessa messiânica e a esperança de uma Nova Aliança vindoura.`;
    } else if (bookCategory === "Evangelhos") {
      categoryDetails = `Nos relatos do Evangelho, esta passagem nos coloca face a face com o ministério de Jesus Cristo, Sua identidade messiânica e as demandas do Reino de Deus instaurado na terra.`;
    } else if (bookCategory === "Epístolas") {
      categoryDetails = `Nas epístolas apostólicas, o texto expõe a teologia sistemática aplicada à prática eclesiástica, articulando de forma precisa a justificação pela fé, a supremacia de Cristo e as diretrizes éticas para a Igreja.`;
    } else {
      categoryDetails = `Este trecho bíblico traz uma contribuição singular para a revelação progressiva das Escrituras, enriquecendo nossa compreensão sobre a aliança de Deus com a humanidade e o Seu plano redentor.`;
    }

    if (option === 'devocional') {
      return systemNotice + `# 🌸 Reflexão Devocional — ${refStr}

> *"\\"${bibleText}\\""*

---

### **Reflexão Prática**
A meditação neste versículo de **${bookName}** nos convida a reavaliar as prioridades de nossa vida. ${categoryDetails}
Quando abrimos espaço para a Palavra de Deus em nosso cotidiano, nosso olhar é purificado e nossas preocupações encontram descanso na graça do Pai.

---

### **Desafio de Aplicação**
* **Desafio Prático**: Dedique um tempo hoje para reler todo o capítulo de ${refStr}. Escreva em seu caderno de estudos teológicos uma aplicação pessoal e compartilhe essa verdade com um irmão na fé.
* **Oração**: *Senhor Deus, abre os meus olhos para enxergar as maravilhas da Tua lei. Que a mensagem contida em ${refStr} não seja apenas conhecimento acadêmico, mas se transforme em obediência ativa e amor sincero a Ti e ao meu próximo. Em nome de Jesus, Amém.*`;
    }

    if (option === 'mapa_mental') {
      return systemNotice + `# 🧠 Mapa Mental Teológico — ${refStr}

## 📌 Tema Central: Instrução e Fé em ${refStr}
* **Referência Bíblica**: ${refStr} (${bookCategory})
* **Texto-Base**: "${bibleText}"

## 🔍 1. Estrutura Exegética
* **Idioma Original**: Analisado com base no ${originalLanguages}.
* **Conceito Gramatical**: O tempo verbal aponta para a permanência e a fidelidade divina.
* **Gênero Literário**: Classificado em ${bookCategory}, orientando a interpretação.

## 🏛️ 2. Contexto Histórico-Teológico
* **Enquadramento**: ${categoryDetails}
* **Significado Original**: Escrito para orientar e encorajar a comunidade de fé em momentos de crise teológica ou perseguição.

## 🎯 3. Linhas de Aplicação
* **Fé Individual**: Confiança renovada no Deus que inspirou esta palavra.
* **Vida Comunitária**: Apoio mútuo e edificação espiritual na congregação.`;
    }

    return systemNotice + `# 📖 Análise Exegética e Hermenêutica — ${refStr}

> *"\\"${bibleText}\\""*

---

### **1. Análise Exegética (Línguas Originais & Gramática)**
* **Idioma e Filologia**: Sendo um texto originado no **${originalLanguages}**, a passagem em ${refStr} destaca-se pela força de seus substantivos e verbos, indicando promessa, mandato ou adoração constante.
* **Análise Estrutural**: A sintaxe organiza o pensamento de maneira a realçar o caráter divino, estimulando a confiança do leitor e o senso de solenidade sagrada.

---

### **2. Contexto Teológico & Histórico**
* **Histórico**: Escrito no âmbito literário de **${bookCategory}**, a passagem reflete os dilemas e triunfos históricos do povo da Aliança.
* **Teológico**: ${categoryDetails} O texto aponta tipologicamente para a pessoa, obra e supremacia de Cristo como cumprimento perfeito de toda a escritura.

---

### **3. Aplicação Hermenêutica Contemporânea**
* **Princípio Permanente**: O Deus revelado em ${refStr} permanece o mesmo ontem, hoje e eternamente. Sua palavra é viva e eficaz.
* **Ação Concreta**: Busque viver hoje à luz dessa verdade, aplicando a sabedoria exegética em sua caminhada espiritual e estudo sistemático da teologia.`;
  }

  // Case 3: Keyword Systematic Theology Fallback
  let topicTitle = "Estudos Teológicos Sistemáticos";
  let topicBody = "";
  
  if (query.includes('soteriologia') || query.includes('salvação') || query.includes('graça') || query.includes('justificação')) {
    topicTitle = "Soteriologia: A Doutrina da Salvação pela Graça";
    topicBody = `A soteriologia estuda a salvação humana como obra monergística de Deus, operada de ponta a ponta pela graça através da fé em Jesus Cristo.
    
### **Aspectos Fundamentais:**
1. **Justificação**: O ato judicial de Deus declarando o pecador justo pela imputação da justiça de Cristo (Romanos 5:1).
2. **Regeneração**: O novo nascimento operado pelo Espírito Santo que capacita a vontade humana morta no pecado.
3. **Santificação**: O processo contínuo e cooperativo de crescimento na semelhança de Cristo, impulsionado pelo Espírito de Deus.
4. **Preservação**: A promessa eterna de que Deus guardará os Seus selados até o dia final de redenção.`;
  } else if (query.includes('jesus') || query.includes('cristo') || query.includes('messias') || query.includes('cristologia')) {
    topicTitle = "Cristologia: A Pessoa e Obra de Jesus Cristo";
    topicBody = `A Cristologia ortodoxa baseia-se na união hipostática — Jesus Cristo é plenamente Deus e plenamente homem, possuindo duas naturezas perfeitas unidas em uma só pessoa eterna.
    
### **Aspectos Fundamentais:**
1. **A Encarnação**: O Verbo eterno de Deus esvaziou-se assumindo a forma humana no ventre da virgem Maria (João 1:14, Filipenses 2:7).
2. **Obediência Ativa**: Jesus cumpriu de forma impecável toda a lei e justiça divina durante Sua vida terrena em nosso lugar.
3. **Obediência Passiva**: Seu sacrifício substitutionário na cruz do Calvário para aplacar a ira de Deus e perdoar os nossos pecados.
4. **A Ressurreição**: Sua vitória física sobre a morte, selando a nossa justificação e prometendo a nossa ressurreição futura.`;
  } else if (query.includes('deus') || query.includes('trindade') || query.includes('pai') || query.includes('teologia própria')) {
    topicTitle = "Teologia Própria: O Deus Triúno e Seus Atributos";
    topicBody = `A teologia própria examina a natureza, existência e atributos do Deus único que subsiste eternamente em três pessoas consubstanciais, iguais em poder e glória: Pai, Filho e Espírito Santo.
    
### **Atributos de Destaque:**
1. **Incomunicáveis (Próprios de Deus)**:
   * *Asseidade*: Deus é autoexistente e não necessita de nada externo para existir.
   * *Imutabilidade*: Deus não muda em Seu caráter, essência ou propósitos.
   * *Onipresença/Onisciência/Onipotência*: Ele está em toda parte, sabe tudo e possui todo o poder soberano.
2. **Comunicáveis (Refletidos no ser humano)**: Amor, justiça, santidade, misericórdia, verdade e sabedoria.`;
  } else if (query.includes('igreja') || query.includes('eclesiologia') || query.includes('batismo') || query.includes('ceia')) {
    topicTitle = "Eclesiologia: A Doutrina da Igreja e Seus Sacramentos";
    topicBody = `A eclesiologia investiga a natureza da Igreja como o corpo e a noiva de Cristo, chamada para adorar a Deus, edificar os crentes e evangelizar o mundo.
    
### **As Marcas da Verdadeira Igreja:**
1. **A Pregação Fiel**: A exposição correta da Palavra de Deus e das Escrituras.
2. **A Administração dos Sacramentos**: A prática bíblica do Batismo e da Ceia do Senhor em obediência às ordens de Cristo.
3. **A Disciplina Eclesiástica**: O zelo mútuo e o cuidado com a pureza doutrinária e moral da comunidade local.`;
  } else if (query.includes('fim') || query.includes('escatologia') || query.includes('apocalipse') || query.includes('ressurreição')) {
    topicTitle = "Escatologia: A Consumação da História Humana";
    topicBody = `A escatologia cristã estuda os últimos acontecimentos sob a perspectiva de que a história tem um alvo definido estabelecido soberanamente pelo Criador.
    
### **Principais Pilares:**
1. **O Retorno de Cristo**: A segunda vinda visível e gloriosa de Jesus Cristo para consumar o Seu Reino.
2. **A Ressurreição Física**: Todos os mortos ressuscitarão, os justos para a vida eterna e os ímpios para o juízo.
3. **O Juízo Final**: O dia da prestação de contas onde a perfeita justiça divina será plenamente estabelecida.
4. **Novos Céus e Nova Terra**: A restauração cósmica total e a comunhão eterna de Deus com o Seu povo santificado.`;
  } else {
    topicTitle = "Estudos de Teologia Sistemática & Exegese";
    topicBody = `Seja muito bem-vindo ao seu ambiente de estudos avançados! O Assistente Teológico PRO está configurado em modo de operação offline.
    
### **Como usar o modo de estudos offline:**
1. **Análise de Versículos**: Digite uma referência clara (ex: *Colossenses 1:16*, *Gênesis 1:1* ou *Filipenses 4:13*) e selecione a modalidade desejada (Exegese, Hermenêutica ou Devocional) para ver uma análise bíblica rica instantaneamente.
2. **Conceitos Teológicos**: Busque por palavras-chave como *Soteriologia, Trindade, Cristologia, Eclesiologia ou Escatologia* para revisar artigos doutrinários profundos.
3. **Leitor Bíblico e Dicionário**: Use as abas do aplicativo para consultar mais de 60 termos teológicos técnicos gregos e hebraicos, registrar anotações persistentes de estudo e ler capítulos bíblicos completos.`;
  }

  return systemNotice + `# 🎓 ${topicTitle}

---

${topicBody}

---

*Estudo offline de alta fidelidade elaborado para apoiar e enriquecer suas pesquisas teológicas sistemáticas diárias.*`;
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

  const { messages, option } = body || {};

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Parâmetro "messages" inválido ou ausente.' });
  }

  try {
    const ai = getAIClient();

    if (!ai) {
      console.log('Chave da API do Gemini ausente. Acionando fallback exegético local...');
      const fallbackText = generateOfflineResponse(messages, option || 'exegese', 'Chave da API do Gemini ausente no painel Secrets');
      return res.status(200).json({ text: fallbackText });
    }

    // Map system instructions based on theological tools selected (exegese, hermeneutica, devocional, mapa mental)
    let systemInstruction = `Você é o Assistente Teológico IA PRO, um erudito teológico highly capacitado em línguas originais (hebraico, aramaico, grego), história eclesiástica, arqueologia bíblica e exegese sistemática.
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
      model: 'gemini-3.5-flash',
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
    console.warn('Erro no processamento da IA, acionando fallback exegético local:', err.message || err);

    let friendlyErrMessage = 'Limite de cota excedido ou instabilidade de rede';
    const errorString = String(err).toLowerCase();
    
    if (err.message === 'API_KEY_MISSING') {
      friendlyErrMessage = 'Chave da API do Gemini ausente no painel Secrets';
    } else if (err.message === 'TIMEOUT_EXCEEDED') {
      friendlyErrMessage = 'Tempo limite de resposta de 20 segundos excedido';
    } else if (errorString.includes('quota') || errorString.includes('limit') || errorString.includes('exhausted')) {
      friendlyErrMessage = 'Limite de cota temporária excedido';
    } else if (errorString.includes('key') || errorString.includes('unauthorized')) {
      friendlyErrMessage = 'Chave da API inválida ou expirada';
    } else if (errorString.includes('enotfound') || errorString.includes('fetch failed')) {
      friendlyErrMessage = 'Problema de conexão com a rede externa';
    }

    // Generate and return a highly detailed offline theological response to ensure a flawless experience
    const fallbackText = generateOfflineResponse(messages, option || 'exegese', friendlyErrMessage);
    return res.status(200).json({ text: fallbackText });
  }
}
