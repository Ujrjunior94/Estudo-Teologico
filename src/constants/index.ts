import { ReadingPlan } from '../types';

export const SYSTEM_BADGES = [
  { id: 'primeiros_passos', title: 'Primeiros Passos', desc: 'Completou a primeira leitura do dia', icon: 'BookOpen', xpReward: 50 },
  { id: 'estudioso_fiel', title: 'Estudioso Fiel', desc: 'Manteve uma sequência diária de 3 dias', icon: 'Flame', xpReward: 100 },
  { id: 'mestre_da_lei', title: 'Mestre da Lei', desc: 'Completou um plano de leitura inteiro', icon: 'Award', xpReward: 500 },
  { id: 'teologo_junior', title: 'Teólogo Júnior', desc: 'Pesquisou 5 termos no dicionário', icon: 'Search', xpReward: 150 },
  { id: 'escriba', title: 'Escriba Moderno', desc: 'Criou sua primeira anotação de estudo', icon: 'Edit3', xpReward: 100 },
  { id: 'estudio_criativo', title: 'Artista do Altar', desc: 'Salvou um slide ou versículo ilustrado no Estúdio', icon: 'Palette', xpReward: 200 }
];

export const HIGHLIGHT_COLORS = [
  { id: 'yellow', value: '#FEF08A', name: 'Amarelo (Revelação)' },
  { id: 'green', value: '#BBF7D0', name: 'Verde (Esperança)' },
  { id: 'blue', value: '#BFDBFE', name: 'Azul (Paz)' },
  { id: 'pink', value: '#FBCFE8', name: 'Rosa (Amor)' },
  { id: 'purple', value: '#E9D5FF', name: 'Roxo (Soberania)' }
];

export const DICTIONARY_CATEGORIES = [
  'Todos',
  'Teologia Sistemática',
  'Soteriologia',
  'Metodologia',
  'Teologia Própria',
  'Teologia Prática'
];

export const DEFAULT_READING_PLANS: ReadingPlan[] = [
  {
    id: 'gospels_30',
    title: 'Os Evangelhos em 15 Dias',
    description: 'Uma jornada intensiva através de Mateus, Marcos, Lucas e João, focando na vida e ensinamentos de Jesus.',
    durationDays: 15,
    completedDays: [],
    completedVerses: [],
    isActive: false,
    tasksPerDay: Array.from({ length: 15 }, (_, i) => ({
      day: i + 1,
      readings: [
        {
          bookId: i % 2 === 0 ? 'MAT' : 'JOH',
          bookName: i % 2 === 0 ? 'Mateus' : 'João',
          chapters: [i + 1, i + 2]
        }
      ]
    }))
  },
  {
    id: 'proverbs_wisdom',
    title: 'Sabedoria de Provérbios',
    description: 'Adquira sabedoria prática diária lendo um capítulo de Provérbios por dia durante um mês.',
    durationDays: 31,
    completedDays: [],
    completedVerses: [],
    isActive: false,
    tasksPerDay: Array.from({ length: 31 }, (_, i) => ({
      day: i + 1,
      readings: [
        {
          bookId: 'PRO',
          bookName: 'Provérbios',
          chapters: [i + 1]
        }
      ]
    }))
  },
  {
    id: 'foundations_faith',
    title: 'Fundamentos da Fé',
    description: 'Explore os capítulos mais teológicos de Gênesis, Salmos, João e Romanos para fortalecer seus alicerces bíblicos.',
    durationDays: 5,
    completedDays: [],
    completedVerses: [],
    isActive: false,
    tasksPerDay: [
      {
        day: 1,
        readings: [{ bookId: 'GEN', bookName: 'Gênesis', chapters: [1] }]
      },
      {
        day: 2,
        readings: [{ bookId: 'PSA', bookName: 'Salmos', chapters: [23] }]
      },
      {
        day: 3,
        readings: [{ bookId: 'JOH', bookName: 'João', chapters: [1] }]
      },
      {
        day: 4,
        readings: [{ bookId: 'ROM', bookName: 'Romanos', chapters: [8] }]
      },
      {
        day: 5,
        readings: [
          { bookId: 'JOH', bookName: 'João', chapters: [3] },
          { bookId: 'EPH', bookName: 'Efésios', chapters: [2] }
        ]
      }
    ]
  }
];
