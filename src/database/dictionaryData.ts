import { TheologicalTerm } from '../types';

export const DICTIONARY_TERMS: TheologicalTerm[] = [
  {
    id: 'hermeneutica',
    term: 'Hermenêutica',
    etymology: 'Do grego hermeneuo (interpretar, explicar, traduzir).',
    category: 'Metodologia',
    definition: 'A ciência e arte de interpretar textos, especialmente as Escrituras Sagradas. Estabelece regras, princípios e métodos para discernir o significado original pretendido pelo autor bíblico.',
    theologicalPerspective: 'A hermenêutica ortodoxa defende o método gramático-histórico, focando no contexto histórico, literário, sintático e teológico para evitar o anacronismo e a eisegese.',
    biblicalReferences: ['2 Timóteo 2:15', 'Neemias 8:8', 'Lucas 24:27']
  },
  {
    id: 'exegese',
    term: 'Exegese',
    etymology: 'Do grego exegeomai (extrair, conduzir para fora).',
    category: 'Metodologia',
    definition: 'O processo técnico de extração do significado original do texto sagrado. Consiste na análise crítica e sistemática das línguas originais (hebraico, aramaico e grego).',
    theologicalPerspective: 'Opõe-se diretamente à eisegese (leitura de pressupostos pessoais dentro do texto). Uma exegese saudável requer análise textual, léxica, gramatical e de contexto histórico.',
    biblicalReferences: ['Atos 17:11', 'Gálatas 3:16', 'Salmos 119:18']
  },
  {
    id: 'soteriologia',
    term: 'Soteriologia',
    etymology: 'Do grego soteria (salvação, libertação) e logos (estudo, tratado).',
    category: 'Teologia Sistemática',
    definition: 'A doutrina teológica que estuda a salvação humana operada por meio da vida, morte, ressurreição e ascensão de Jesus Cristo.',
    theologicalPerspective: 'Abrange temas cruciais como graça comum, graça salvadora, eleição, regeneração, conversão (arrependimento e fé), justificação, adoção, santificação e glorificação.',
    biblicalReferences: ['Efésios 2:8-9', 'Romanos 1:16', 'Hebreus 2:3']
  },
  {
    id: 'justificacao',
    term: 'Justificação',
    etymology: 'Do latim justificatio (declarar justo).',
    category: 'Soteriologia',
    definition: 'O ato judicial de Deus pelo qual Ele declara o pecador arrependido justo perante Si, com base na justiça imputada de Jesus Cristo recebida unicamente pela fé.',
    theologicalPerspective: 'Um dos pilares da Reforma Protestante (Sola Fide). Não é uma mudança intrínseca no indivíduo (que é a santificação), mas uma alteração de seu status legal diante de Deus.',
    biblicalReferences: ['Romanos 5:1', 'Gálatas 2:16', 'Romanos 3:24']
  },
  {
    id: 'escatologia',
    term: 'Escatologia',
    etymology: 'Do grego eschatos (último, derradeiro) e logos (estudo).',
    category: 'Teologia Sistemática',
    definition: 'O ramo da teologia sistemática que estuda os eventos das últimas coisas, incluindo a morte física, o estado intermediário da alma, a segunda vinda de Cristo, a ressurreição, o julgamento final e os novos céus e nova terra.',
    theologicalPerspective: 'Divide-se em escatologia pessoal (destino pós-morte) e escatologia cósmica (parusia, milênio e eternidade). Existem diferentes escolas milenares: amilenismo, pré-milenismo e pós-milenismo.',
    biblicalReferences: ['Apocalipse 21:1-4', 'Mateus 24:36', '1 Tessalonicenses 4:16-17']
  },
  {
    id: 'trindade',
    term: 'Trindade',
    etymology: 'Do latim trinitas (três em unidade).',
    category: 'Teologia Própria',
    definition: 'A doutrina de que Deus coexiste eternamente como três Pessoas distintas: o Pai, o Filho e o Espírito Santo. Cada Pessoa é totalmente Deus, contudo há apenas um Deus.',
    theologicalPerspective: 'Expressa perfeitamente na fórmula ortodoxa estabelecida nos Concílios de Niceia (325 d.C.) e Constantinopla (381 d.C.). Rejeita tanto o triteísmo quanto o modalismo (sabelianismo).',
    biblicalReferences: ['Mateus 28:19', '2 Coríntios 13:14', 'Gênesis 1:26']
  },
  {
    id: 'cristologia',
    term: 'Cristologia',
    etymology: 'Do grego Christos (o Ungido, Messias) e logos (estudo).',
    category: 'Teologia Sistemática',
    definition: 'O estudo teológico acerca da Pessoa, natureza e obra salvífica de Jesus Cristo.',
    theologicalPerspective: 'Afirma a união hipostática: Jesus é verdadeiramente Deus e verdadeiramente homem, duas naturezas perfeitas unidas inseparavelmente em uma única Pessoa (Concílio de Calcedônia, 451 d.C.).',
    biblicalReferences: ['João 1:14', 'Filipenses 2:5-11', 'Colossenses 1:15-20']
  },
  {
    id: 'pneumatologia',
    term: 'Pneumatologia',
    etymology: 'Do grego pneuma (espírito, sopro, vento) e logos (estudo).',
    category: 'Teologia Sistemática',
    definition: 'A seção da teologia que estuda a Pessoa, os atributos e as obras do Espírito Santo.',
    theologicalPerspective: 'Reconhece o Espírito Santo como uma Pessoa divina co-eterna e consubstancial com o Pai e o Filho, atuando na criação, inspiração bíblica, convicção do pecado, regeneração e capacitação da Igreja com dons.',
    biblicalReferences: ['João 14:16-17', 'Atos 1:8', '1 Coríntios 12:4-11']
  },
  {
    id: 'alianca',
    term: 'Teologia da Aliança (Aliancismo)',
    etymology: 'Do latim foedus (pacto, aliança).',
    category: 'Teologia Sistemática',
    definition: 'Um sistema teológico que interpreta a história bíblica através de pactos ou alianças fundamentais estabelecidos por Deus com a humanidade.',
    theologicalPerspective: 'Identifica tradicionalmente três pactos eternos: o Pacto da Redenção (na eternidade entre o Pai e o Filho), o Pacto das Obras (no Éden) e o Pacto da Graça (pós-queda, administrado em diferentes dispensações bíblicas).',
    biblicalReferences: ['Gênesis 15:18', 'Jeremias 31:31', 'Hebreus 8:6']
  },
  {
    id: 'apologetica',
    term: 'Apologética',
    etymology: 'Do grego apologia (defesa jurídica, resposta fundamentada).',
    category: 'Teologia Prática',
    definition: 'A disciplina teológica dedicada a defender a fé cristã contra objeções intelectuais, demonstrando a sua racionalidade, coerência e verdade histórica.',
    theologicalPerspective: 'Duas principais vertentes: a Apologética Clássica/Evidencialista (que usa evidências lógicas e arqueológicas) e a Apologética Pressuposicionalista (que defende que as Escrituras são o ponto de partida auto-evidente).',
    biblicalReferences: ['1 Pedro 3:15', 'Filipenses 1:7', 'Atos 17:22-31']
  },
  {
    id: 'graca',
    term: 'Graça',
    etymology: 'Do latim gratia, e do grego charis (favor imerecido, dádiva generosa).',
    category: 'Soteriologia',
    definition: 'O favor imerecido de Deus concedido ao ser humano pecador, manifestado principalmente na redenção gratuita em Jesus Cristo.',
    theologicalPerspective: 'Divide-se em Graça Comum (benefícios temporais dados a todos, crentes ou não, como sol e chuva) e Graça Especial/Salvadora (concedida soberanamente para salvação eterna).',
    biblicalReferences: ['Efésios 2:8', 'Romanos 3:24', 'Tito 2:11']
  },
  {
    id: 'teofania',
    term: 'Teofania',
    etymology: 'Do grego theophaneia (manifestação visível de Deus).',
    category: 'Teologia Própria',
    definition: 'Uma aparição ou manifestação física e temporária de Deus ao ser humano no Antigo Testamento.',
    theologicalPerspective: 'Muitos teólogos interpretam manifestações como "o Anjo do Senhor" como Cristofanias: aparições pré-encarnadas da segunda Pessoa da Trindade.',
    biblicalReferences: ['Gênesis 18:1-3', 'Êxodo 3:2-6', 'Josué 5:13-15']
  }
];

// Generates unaccented terms for instant clean matching
export function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function searchDictionaryTerms(query: string): TheologicalTerm[] {
  const cleanQuery = removeAccents(query.toLowerCase());
  return DICTIONARY_TERMS.filter(term => {
    const cleanTerm = removeAccents(term.term.toLowerCase());
    const cleanDef = removeAccents(term.definition.toLowerCase());
    return cleanTerm.includes(cleanQuery) || cleanDef.includes(cleanQuery);
  });
}
