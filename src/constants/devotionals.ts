export interface DevotionalItem {
  id: string;
  category: string;
  title: string;
  slug: string;
  scripture: string;
  passageText: string;
  reflection: string;
  practicalChallenge: string;
  prayer: string;
  xpReward: number;
}

export const THEMATIC_DEVOTIONALS: DevotionalItem[] = [
  {
    id: 'dev_casais',
    category: 'Casais',
    title: 'O Cordão de Três Dobras',
    slug: 'casais',
    scripture: 'Eclesiastes 4:9-12 & Efésios 5:21-22',
    passageText: '"Melhor é serem dois do que um... Porque se um cair, o outro levanta o seu companheiro; mas ai do que estiver só; pois, caindo, não haverá outro que o levante... E o cordão de três dobras não se quebra facilmente."',
    reflection: 'No plano original do Criador, o casamento não é apenas uma aliança horizontal entre duas pessoas, mas uma união sagrada tridimensional, onde Deus habita no centro da relação. Quando os desafios diários tentam enfraquecer o relacionamento, é a presença do Senhor que traz estabilidade e renovação. Cuidar do cônjuge, apoiar nas dificuldades e manter a intimidade espiritual é refletir o próprio amor sacrificial de Cristo pela Sua Igreja.',
    practicalChallenge: 'Reúnam-se hoje por 10 minutos sem telas. Compartilhem três qualidades pelas quais são gratos um no outro e façam uma oração sincera de mãos dadas, consagrando a família ao Senhor.',
    prayer: 'Pai de amor, nós Te convidamos a ser o centro inabalável do nosso matrimônio. Ampara-nos nos dias difíceis, enche nosso lar com Tua paciência e doçura, e que o nosso amor reflita a Tua graça reconciliadora. Em nome de Jesus, Amém.',
    xpReward: 60
  },
  {
    id: 'dev_homem',
    category: 'Desafios do Homem',
    title: 'Firmeza na Integridade',
    slug: 'desafios-homem',
    scripture: '1 Coríntios 16:13 & Provérbios 4:23',
    passageText: '"Sede vigilantes, permanecei firmes na fé, portai-vos varonilmente, fortalecei-vos. Sobre tudo o que se deve guardar, guarda o teu coração, porque dele procedem as fontes da vida."',
    reflection: 'A sociedade contemporânea impõe pressões monumentais sobre o homem moderno: sucesso financeiro a qualquer custo, autossuficiência e a busca por prazeres efêmeros. O chamado bíblico, no entanto, é para a coragem enraizada na integridade espiritual e na responsabilidade ativa. Ser homem de Deus significa ser o primeiro a servir, o primeiro a se arrepender e o guardião incansável do próprio coração e caráter nas horas em que ninguém está olhando.',
    practicalChallenge: 'Identifique hoje um hábito ou pensamento secreto que tenta desviar sua integridade. Escreva um compromisso prático de pureza e, se possível, compartilhe com um irmão de confiança para apoio mútuo.',
    prayer: 'Senhor, molda em mim o caráter de um verdadeiro homem de aliança. Livra-me do orgulho de querer resolver tudo sozinho e concede-me bravura moral para rejeitar o mal e abraçar a verdade, servindo à minha família e igreja com honra. Amém.',
    xpReward: 60
  },
  {
    id: 'dev_mulher',
    category: 'Mulher Sábia',
    title: 'Edificando sobre a Rocha',
    slug: 'mulher-sabia',
    scripture: 'Provérbios 14:1 & Provérbios 31:30',
    passageText: '"A mulher sábia edifica a sua casa, mas a tola com as próprias mãos a derruba. Enganosa é a graça, e vaidade, a formosura, mas a mulher que teme ao Senhor, essa será louvada."',
    reflection: 'A sabedoria bíblica feminina transcende a habilidade doméstica ou estética passageira; ela é uma força espiritual ativa fundamentada no temor a Deus. Edificar a casa significa cultivar um ambiente de paz, discernimento, encorajamento e oração. A mulher sábia sabe quando falar e quando se calar, reconhecendo que suas palavras têm o poder de curar ou destruir legados inteiros.',
    practicalChallenge: 'Evite qualquer reclamação ou palavra depreciativa hoje. Em vez disso, seja uma fonte intencional de ânimo, profetizando bênção sobre aqueles que estão ao seu redor e no seu lar.',
    prayer: 'Deus de sabedoria, concede-me discernimento espiritual para edificar minha vida, laços e propósitos na Tua Palavra. Guarda meus lábios da murmuração e enche meu coração com a graça que restaura ambientes e acalma tempestades. Amém.',
    xpReward: 60
  },
  {
    id: 'dev_negocios',
    category: 'Deus e Negócios',
    title: 'Negócios para a Glória do Criador',
    slug: 'deus-negocios',
    scripture: 'Colossenses 3:23-24 & Provérbios 16:3',
    passageText: '"Tudo quanto fizerdes, fazei-o de todo o coração, como para o Senhor e não para homens... Confia ao Senhor as tuas obras, e os teus desígnios serão estabelecidos."',
    reflection: 'Existe uma falsa dicotomia entre a vida espiritual e as atividades comerciais. Para o cristão, o mercado de trabalho, a empresa ou o empreendimento são extensões do altar de adoração. Conduzir negócios éticos, honrar contratos, tratar colaboradores com justiça e valorizar a excelência técnica glorifica a Deus tanto quanto cantar cânticos no templo. O dinheiro é um instrumento de provisão e generosidade, sob a soberania divina.',
    practicalChallenge: 'Antes de iniciar suas tarefas de trabalho hoje, faça uma consagração silenciosa da sua mesa, reuniões ou decisões. Comprometa-se a agir com honestidade radical em cada centavo transacionado.',
    prayer: 'Senhor, consagro minha profissão, carreira e negócios a Ti. Que minha busca por sustento nunca comprometa meus valores éticos. Dá-me ideias criativas e sabedoria para prosperar com justiça, servindo ao próximo e honrando Teu nome. Amém.',
    xpReward: 60
  },
  {
    id: 'dev_dificeis',
    category: 'Momentos Difíceis',
    title: 'A Âncora em Meio à Tempestade',
    slug: 'momentos-dificeis',
    scripture: 'Salmo 46:1-3 & Isaías 43:2',
    passageText: '"Deus é o nosso refúgio e fortaleza, socorro bem-presente nas tribulações. Pelo que não temeremos, ainda que a terra se transtorne... Quando passares pelas águas, eu serei contigo; quando pelos rios, eles não te submergirão."',
    reflection: 'O sofrimento e as tribulações são realidades inevitáveis em nossa jornada terrena, mas o evangelho nos garante que nunca passaremos por eles desamparados. A presença de Deus nos momentos mais escuros é como um farol inabalável. Ele não nos isenta das tormentas, mas promete que as águas não nos afogarão. A nossa dor presente está sendo trabalhada por Ele para produzir perseverança, caráter aprovado e uma esperança que não decepciona.',
    practicalChallenge: 'Escreva em um caderno ou papel três momentos do passado em que Deus te livrou de aflições extremas. Leia em voz alta para si mesmo como lembrete de que o mesmo Deus continua ativo hoje.',
    prayer: 'Pai compassivo, meu coração se sente cansado e aflito pelas provações. Mas eu decido prender minha âncora de fé na Tua soberana bondade. Sei que estás no barco comigo. Dá-me paz silenciosa enquanto espero pelo Teu amanhecer. Amém.',
    xpReward: 60
  },
  {
    id: 'dev_resgatado',
    category: 'Resgatado',
    title: 'Das Trevas para a Maravilhosa Luz',
    slug: 'resgatado',
    scripture: 'Colossenses 1:13-14 & Efésios 2:4-5',
    passageText: '"Ele nos libertou do império das trevas e nos transportou para o reino do seu Filho amado, no qual temos a redenção, a remissão dos pecados. Mas Deus, sendo rico em misericórdia, por causa do grande amor com que nos amou... nos deu vida juntamente com Cristo."',
    reflection: 'Ser cristão é carregar a marca gloriosa do resgate. Estávamos espiritualmente mortos, cativos em nossas próprias transgressões e incapazes de nos salvar. No entanto, por meio do sangue de Jesus Cristo derramado na cruz, fomos redimidos, perdoados e adotados como filhos. Esse resgate definitivo nos confere uma nova identidade eterna que nenhuma acusação ou circunstância terrena pode revogar.',
    practicalChallenge: 'Compartilhe hoje seu testemunho de fé com alguém ou reserve um momento de adoração profunda individual, listando em voz alta as amarras das quais Jesus já te libertou.',
    prayer: 'Senhor Jesus Cristo, quão sublime é o Teu amor redentor! Obrigado por descer ao abismo para me estender a Tua mão misericordiosa. Vivo hoje livre e justificado pelo Teu sangue. Que minha história aponte para a Tua maravilhosa luz. Amém.',
    xpReward: 60
  },
  {
    id: 'dev_ansiedade',
    category: 'Saúde Mental e Ansiedade',
    title: 'A Quietude do Coração em Deus',
    slug: 'ansiedade-paz',
    scripture: 'Filipenses 4:6-7 & 1 Pedro 5:7',
    passageText: '"Não andeis ansiosos de coisa alguma; em tudo, porém, sejam conhecidas diante de Deus as vossas petições, pela oração e pela súplica, com ações de graças. E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e as vossas mentes em Cristo Jesus. Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós."',
    reflection: 'A ansiedade moderna é um ruído constante que fragmenta nossa atenção, rouba nosso foco e nos faz viver no futuro, sob o peso de cenários imaginários que raramente se concretizam. O apóstolo Paulo nos convida a uma postura contra-intuitiva: em vez de ruminarmos nossas preocupações, devemos convertê-las em oração ativa e ação de graças. Essa "paz que excede o entendimento" não é a ausência de problemas, mas a presença inabalável do Príncipe da Paz que atua como sentinela de nossas mentes e corações.',
    practicalChallenge: 'Toda vez que um pensamento ansioso ou preocupação sobre o futuro invadir sua mente hoje, interrompa o ciclo mental de forma consciente, respire fundo por 5 segundos e faça uma pequena oração de gratidão por três coisas concretas no seu presente.',
    prayer: 'Senhor Jesus, ajuda-me a desarmar o tribunal da ansiedade em minha mente. Eu escolho depositar sob Teu cuidado soberano todas as incertezas do meu amanhã. Que a Tua paz inefável governe as batidas do meu coração hoje. Amém.',
    xpReward: 60
  },
  {
    id: 'dev_jovens',
    category: 'Jovens e Propósito',
    title: 'Identidade Consagrada no Altar',
    slug: 'jovens-proposito',
    scripture: 'Eclesiastes 12:1 & 1 Timóteo 4:12',
    passageText: '"Lembra-te do teu Criador nos dias da tua mocidade, antes que venham os maus dias... Ninguém despreze a tua mocidade; pelo contrário, torna-te padrão dos fiéis, na palavra, no procedimento, no amor, na fé, na pureza."',
    reflection: 'A juventude é a estação das grandes escolhas, da busca de identidade e da definição de caminhos profissionais e pessoais. Contudo, em uma era saturada de narrativas de sucesso efêmero nas redes sociais, é fácil perder-se em comparações vazias. O propósito bíblico não consiste em autoafirmação ou fama, mas em descobrir quem você é em Cristo e usar seu vigor e inteligência para glorificar o Criador. Ser o "padrão dos fiéis" significa liderar pela integridade, mostrando que a santidade é a maior marca de nobreza de uma vida jovem.',
    practicalChallenge: 'Faça um jejum de redes sociais (Instagram, TikTok, Twitter, etc.) por pelo menos 4 horas seguidas hoje. Dedique parte desse tempo para ler um livro inspirador ou fazer anotações sobre seus objetivos de vida à luz da eternidade.',
    prayer: 'Pai Eterno, livra-me da ilusão de viver para agradar aos padrões deste século. Consagro a Ti a minha juventude, minha mente, minhas ambições e meu futuro. Que a minha força e dons apontem sempre para o Teu Reino. Amém.',
    xpReward: 60
  },
  {
    id: 'dev_disciplinas',
    category: 'Disciplinas Espirituais',
    title: 'O Altar Secreto e Diário',
    slug: 'disciplinas-espirituais',
    scripture: 'Mateus 6:6 & Salmo 119:9-11',
    passageText: '"Tu, porém, quando orares, entra no teu quarto e, fechada a porta, orará a teu Pai, que está em secreto; e teu Pai, que vê em secreto, te recompensará... Guardo no coração as tuas palavras, para não pecar contra ti."',
    reflection: 'A maturidade cristã não é medida pelo nosso desempenho público, mas pela densidade da nossa comunhão secreta com Deus. As disciplinas espirituais — a oração silenciosa, a leitura sistemática das Escrituras, a meditação e o jejum — não são meras obrigações religiosas, mas canais de graça projetados para moldar o nosso coração à semelhança de Jesus. O altar secreto é o lugar onde nossas maiores batalhas são vencidas e onde o Espírito Santo nos cura, restaura e reveste com o Seu poder de forma contínua.',
    practicalChallenge: 'Estabeleça um horário específico e inegociável para seu momento a sós com Deus amanhã cedo. Deixe o celular em outro cômodo e passe os primeiros 5 minutos em silêncio absoluto, apenas acolhendo a doce presença do Espírito Santo.',
    prayer: 'Senhor do Secreto, perdoa-me pelo ativismo e pela pressa que tantas vezes sufocam minha intimidade contigo. Quero restaurar o altar da devoção diária no meu coração. Encontra-me no secreto e transforma o meu viver. Amém.',
    xpReward: 60
  },
  {
    id: 'dev_perdao',
    category: 'Perdão e Restauração',
    title: 'O Poder Libertador do Perdão',
    slug: 'perdao-restauracao',
    scripture: 'Colossenses 3:13 & Mateus 18:21-22',
    passageText: '"Suportai-vos uns aos outros, perdoai-vos mutuamente, caso alguém tenha motivo de queixa contra outrem. Assim como o Senhor vos perdoou, assim também perdoai vós... Senhor, até quantas vezes pecará meu irmão contra mim, e eu lhe perdoarei? Até sete? Respondeu-lhe Jesus: Não te digo que até sete; mas até setenta vezes sete."',
    reflection: 'Guardar rancor e ressentimento é como beber veneno esperando que a outra pessoa morra. O perdão não é um sentimento, mas uma decisão voluntária e obediente de liberar o ofensor e abrir mão do direito à vingança, entregando a justiça a Deus. Ao perdoar, não minimizamos o erro alheio, mas escolhemos a liberdade espiritual. Fomos perdoados de uma dívida impagável na cruz; logo, negar o perdão ao nosso próximo é negar a própria essência do Evangelho reconciliador.',
    practicalChallenge: 'Pense em alguém que te ofendeu ou magoou profundamente recentemente. Tome a decisão consciente de perdoar essa pessoa. Ore especificamente pela vida dela hoje, pedindo que Deus a abençoe em suas necessidades físicas e espirituais.',
    prayer: 'Pai de Misericórdia, Teu perdão me resgatou de uma condenação justa. Capacita-me, pelo Teu Santo Espírito, a liberar o perdão a todos aqueles que me feriram. Arranca do meu coração toda raiz de amargura e cura as minhas memórias. Amém.',
    xpReward: 60
  }
];

export interface DevotionalDay {
  dayNumber: number;
  title: string;
  scripture: string;
  passageText: string;
  reflection: string;
  practicalChallenge: string;
  prayer: string;
}

export interface DevotionalJourney {
  id: string;
  category: string;
  title: string;
  slug: string;
  description: string;
  durationDays: number;
  days: DevotionalDay[];
  xpRewardPerDay: number;
}

export const DEVOTIONAL_JOURNEYS: DevotionalJourney[] = [
  {
    id: 'journey_mente_renovada',
    category: 'Mente e Emoções',
    title: 'A Mente Renovada',
    slug: 'mente-renovada',
    description: 'Um mergulho profundo na neuroteologia paulina e no descanso do Espírito contra a sobrecarga mental e ansiedade.',
    durationDays: 3,
    xpRewardPerDay: 40,
    days: [
      {
        dayNumber: 1,
        title: 'O Combate às Fortalezas Mentais',
        scripture: '2 Coríntios 10:4-5',
        passageText: '"Porque as armas da nossa milícia não são carnais, mas sim poderosas em Deus para destruição das fortalezas; destruindo os conselhos, e toda a altivez que se levanta contra o conhecimento de Deus, e levando cativo todo o pensamento à obediência de Cristo."',
        reflection: 'A mente humana é o principal campo de batalha espiritual. Fortaleza mental, no contexto bíblico, é um padrão rígido de pensamento baseado em mentiras, medos, ou traumas que se levanta contra a verdade divina. Paulinamente falando, somos chamados a um papel ativo: "levar cativo" cada pensamento. Não somos vítimas passivas dos nossos pensamentos automáticos; temos a autoridade em Cristo para analisar e desarmar cada narrativa mentirosa sobre nós e sobre Deus.',
        practicalChallenge: 'Identifique hoje um pensamento recorrente de autossabotagem, desespero ou medo. Escreva-o em um papel e, ao lado, escreva o versículo bíblico que desmente esse pensamento. Mentalize e declare a verdade de Deus.',
        prayer: 'Senhor, coloco a minha mente sob o Teu senhorio. Capacita-me a discernir e levar cativos os pensamentos que tentam me paralisar. Destrói as fortalezas do medo e enche-me com a Tua paz. Amém.'
      },
      {
        dayNumber: 2,
        title: 'A Metamorfose da Mente',
        scripture: 'Romanos 12:2',
        passageText: '"E não vos conformeis com este século, mas transformai-vos pela renovação da vossa mente, para que experimenteis qual seja a boa, agradável e perfeita vontade de Deus."',
        reflection: 'O termo grego usado para "transformar" é metamorfoó (de onde vem metamorfose). A renovação mental não é um simples esforço moral de pensamento positivo, mas uma reprogramação estrutural operada pelo Espírito Santo à medida que nos alimentamos das Escrituras. Estar "conformado" com o mundo é aceitar a fôrma de estresse, egoísmo e ansiedade deste século. A renovação restaura nossa visão espiritual.',
        practicalChallenge: 'Substitua 30 minutos de consumo de notícias ou redes sociais por meditação focada no Salmo 23 ou 119. Deixe que a Palavra mude sua perspectiva do dia.',
        prayer: 'Deus Eterno, não quero ser moldado pelo sistema e cultura deste século. Renova a minha mente com a Tua eterna verdade. Concede-me discernimento e pureza nos pensamentos. Amém.'
      },
      {
        dayNumber: 3,
        title: 'O Foco na Excelência Divina',
        scripture: 'Filipenses 4:8',
        passageText: '"Finalmente, irmãos, tudo o que é verdadeiro, tudo o que é respeitável, tudo o que é justo, tudo o que é puro, tudo o que é amável, tudo o que é de boa fama, se alguma virtude há e se algum louvor existe, seja isso o que ocupe o vosso pensamento."',
        reflection: 'Nossa mente gravita naturalmente em direção ao que mais consumimos e focamos. No último dia desta jornada, Paulo nos dá um filtro prático com oito critérios de excelência para proteger nossa ecologia mental. Focar no que é puro, amável e de boa fama é um ato de adoração e preservação da paz. É um convite a preencher o espaço mental com a bondade divina e os feitos redentores de Cristo.',
        practicalChallenge: 'Faça uma lista de 5 coisas belas, puras e louváveis pelas quais você louva a Deus hoje (uma pessoa querida, um milagre recente, a beleza da criação, a salvação). Agradeça por cada uma.',
        prayer: 'Senhor Jesus, ajuda-me a cultivar um solo mental fértil e saudável. Decido focar nas Tuas promessas, no Teu caráter bondoso e no que edifica. Guarda meu coração de toda impureza e fofoca. Amém.'
      }
    ]
  },
  {
    id: 'journey_fe_fogo',
    category: 'Teologia do Sofrimento',
    title: 'Fé sob Fogo: O Mistério da Provação',
    slug: 'fe-sob-fogo',
    description: 'Um roteiro teológico profundo para compreender o agir soberano e consolador de Deus em meio às maiores dores e aflições da vida.',
    durationDays: 3,
    xpRewardPerDay: 40,
    days: [
      {
        dayNumber: 1,
        title: 'O Cadinho da Fé',
        scripture: '1 Pedro 1:6-7',
        passageText: '"Nisso exultais, embora, no presente, por breve tempo, se necessário, sejais contristados por várias provações, para que a prova da vossa fé, muito mais preciosa do que o ouro perecível, mesmo apurado por fogo, redunde em louvor, glória e honra na revelação de Jesus Cristo."',
        reflection: 'A provação não é um sinal da ausência de Deus, mas muitas vezes um indicativo do Seu cuidado cirúrgico. Assim como o ouro é lançado no fogo para que as escórias e impurezas flutuem e sejam removidas, nossa fé passa pelo cadinho da aflição para ser purificada de segundas intenções. Deus está mais interessado em nosso caráter eterno do que no nosso conforto imediato.',
        practicalChallenge: 'Ao invés de perguntar "Por que estou passando por isso?", mude a pergunta hoje para "O que o Senhor deseja me ensinar através desta circunstância?".',
        prayer: 'Pai celestial, embora o fogo da provação doa, eu confio na Tua mão que controla a temperatura do cadinho. Purifica minha fé, remove meu egoísmo e faz-me brilhar com a imagem de Jesus. Amém.'
      },
      {
        dayNumber: 2,
        title: 'O Mistério do Silêncio Divino',
        scripture: 'Jó 23:8-10',
        passageText: '"Eis que me vou para o oriente, e não está ali; para o ocidente, e não o percebo; se opera à esquerda, não o vejo; esquiva-se à direita, e não o diviso. Mas ele sabe o meu caminho; se ele me provar, sairei como o ouro."',
        reflection: 'Uma das dores mais profundas na provação é o aparente silêncio de Deus. Jó expressa a agonia de buscar a Deus em todas as direções e não O encontrar visivelmente. No entanto, o ápice de sua fé é declarar: "Mas Ele sabe o meu caminho". O silêncio de Deus não é apatia ou abandono; é o ambiente onde nossa confiança é testada além dos sentimentos visíveis.',
        practicalChallenge: 'Passe 10 minutos em silêncio hoje, sem pedir nada, apenas declarando com convicção: "Eu não Te sinto hoje, Senhor, mas decido confiar que Tu estás me guardando".',
        prayer: 'Senhor, perdoa-me quando confundo Teu silêncio com a Tua ausência. Mesmo quando não vejo ou sinto, sei que estás operando por trás das cortinas. Sustenta-me firmemente. Amém.'
      },
      {
        dayNumber: 3,
        title: 'O Consolo que Transborda',
        scripture: '2 Coríntios 1:3-4',
        passageText: '"Bendito seja o Deus e Pai de nosso Senhor Jesus Cristo, o Pai das misericórdias e o Deus de toda a consolação; que nos consola em toda a nossa tribulação, para que também possamos consolar os que estiverem em alguma tribulação, com a consolação com que nós mesmos somos consolados por Deus."',
        reflection: 'O sofrimento cristão nunca é desperdiçado. O Deus de toda a consolação não apenas nos cura, mas nos credencia a sermos ministros de consolo para os outros. As cicatrizes que carregamos se transformam em pontes de empatia e esperança para corações feridos. Há um propósito comunitário e terapêutico na dor redimida por Deus.',
        practicalChallenge: 'Entre em contato hoje com alguém que você sabe que está passando por um momento de dor ou luto. Ofereça uma palavra de apoio sincera, sem julgamentos.',
        prayer: 'Pai de Misericórdia, obrigado pelo Teu consolo que cura minhas feridas. Faz-me um canal da Tua graça para os aflitos ao meu redor. Que minha dor seja transformada em remédio para outros. Amém.'
      }
    ]
  },
  {
    id: 'journey_legado_alianca',
    category: 'Família e Relacionamentos',
    title: 'O Legado da Aliança: Família e Discipulado',
    slug: 'legado-alianca',
    description: 'Como estabelecer princípios bíblicos inabaláveis para discipular a próxima geração e blindar o altar do lar.',
    durationDays: 3,
    xpRewardPerDay: 40,
    days: [
      {
        dayNumber: 1,
        title: 'A Instrução no Caminho',
        scripture: 'Deuteronômio 6:6-7',
        passageText: '"Estas palavras que hoje te ordeno estarão no teu coração; e as intimarás a teus filhos, e delas falarás assentado em tua casa, e andando pelo caminho, e ao deitar-te, e ao levantar-te."',
        reflection: 'O discipulado no lar não é um evento formal de domingo, mas uma atmosfera diária e integrada à rotina. "Andando pelo caminho, ao deitar-te, ao levantar-te" aponta para a naturalidade da transmissão da fé. Os filhos aprendem mais com o que observam na mesa, nas reações de estresse e na devoção prática dos pais do que com sermões formais.',
        practicalChallenge: 'Durante a refeição em família ou um momento com quem você convive hoje, puxe uma conversa intencional sobre Deus de forma natural, perguntando o que Ele fez de bom na semana.',
        prayer: 'Senhor, que a Tua verdade esteja primeiro gravada no meu coração, para que eu possa ensiná-la com integridade e amor aos que me cercam. Faz do meu lar um centro de discipulado diário. Amém.'
      },
      {
        dayNumber: 2,
        title: 'A Liderança do Avental',
        scripture: 'Efésios 5:25 & Lucas 22:26',
        passageText: '"Maridos, amai vossa mulher, como também Cristo amou a igreja e a si mesmo se entregou por ela... mas o maior entre vós seja como o menor; e quem governa, como quem serve."',
        reflection: 'A autoridade espiritual no lar bíblico não se estabelece por imposição ou gritos, mas pelo serviço humilde e sacrificial. Jesus redefiniu a liderança ao cingir-se com uma toalha e lavar os pés dos discípulos. O marido ou líder espiritual que ama como Cristo ama entrega-se a si mesmo, liderando pelo exemplo, paciência e proteção espiritual do lar.',
        practicalChallenge: 'Identifique uma tarefa de serviço doméstico simples que você normalmente evita e faça-a hoje de surpresa, abençoando o seu cônjuge ou membros da família.',
        prayer: 'Senhor Jesus, ensina-me a liderar servindo. Remove todo o autoritarismo e orgulho do meu coração. Que eu possa amar minha família de forma prática, sacrificial e terna. Amém.'
      },
      {
        dayNumber: 3,
        title: 'O Altar Familiar Restaurado',
        scripture: 'Josué 24:15',
        passageText: '"Porém, se vos parece mal servir ao Senhor, escolhei hoje a quem sirvais... Porém eu e a minha casa serviremos ao Senhor."',
        reflection: 'A decisão de servir ao Senhor com toda a casa exige intencionalidade e firmeza contra as distrações deste século. Josué faz uma declaração pública de aliança inegociável. Restaurar o altar familiar é resgatar o hábito de ler a Palavra juntos, pedir perdão uns aos outros e interceder pelas gerações futuras, construindo uma herança espiritual inabalável.',
        practicalChallenge: 'Separe 10 a 15 minutos hoje para realizar um pequeno altar de oração e leitura bíblica com as pessoas do seu lar ou um amigo de caminhada cristã.',
        prayer: 'Deus da Aliança, eu e a minha casa decidimos e escolhemos servir ao Senhor. Blinda nosso lar contra os ataques do inimigo e que as futuras gerações da nossa família Te conheçam e Te amem profundamente. Amém.'
      }
    ]
  }
];

