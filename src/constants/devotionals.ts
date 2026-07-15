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
  }
];
