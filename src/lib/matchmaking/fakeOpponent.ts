import type { FakeOpponent } from '@/lib/store/gameStore';

const OPPONENT_NAMES = [
  'Fizjeet',
  'Maqmullah',
  'Fardeeq',
  'Moohamhead',
  'Quadook',
  'Sanjeet',
  'Haltooz',
  'Sindikahalar',
  'Barfook',
  'Toolbar',
  'Klanjuqi',
  'Nazimor',
  'Yuldar',
  'Rafiqon',
  'Mavludo',
  'Beksultan',
  'Zoravar',
  'Tajinder',
  'Farooqz',
  'Khalduun',
];

const COUNTRIES = [
  { code: 'IN', flag: '🇮🇳' },
  { code: 'PK', flag: '🇵🇰' },
  { code: 'BD', flag: '🇧🇩' },
  { code: 'TR', flag: '🇹🇷' },
  { code: 'ID', flag: '🇮🇩' },
  { code: 'MY', flag: '🇲🇾' },
  { code: 'MA', flag: '🇲🇦' },
  { code: 'EG', flag: '🇪🇬' },
  { code: 'BR', flag: '🇧🇷' },
  { code: 'MX', flag: '🇲🇽' },
  { code: 'PH', flag: '🇵🇭' },
  { code: 'ZA', flag: '🇿🇦' },
];

const GRADIENTS = [
  'from-rose-500 to-orange-500',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-fuchsia-500 to-pink-600',
  'from-amber-400 to-red-500',
  'from-indigo-500 to-sky-500',
  'from-lime-500 to-green-700',
  'from-violet-500 to-purple-700',
];

const EMOJIS = ['👍', '🎱', '🔥', '😎', '👏', '💪'];

function randomInt(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function pick<T>(items: readonly T[]) {
  return items[randomInt(0, items.length - 1)];
}

function createInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export function createMatchRoomId() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `FAKE-${Date.now().toString(36).toUpperCase()}-${suffix}`;
}

export function generateFakeOpponent(playerLevel: number): FakeOpponent {
  const name = pick(OPPONENT_NAMES);
  const country = pick(COUNTRIES);
  const winRate = randomInt(40, 70);
  const wins = randomInt(18, 940);
  const levelOffset = randomInt(-3, 4);
  const level = Math.max(1, playerLevel + levelOffset);

  return {
    id: `op_${Math.random().toString(36).slice(2, 10)}`,
    roomId: createMatchRoomId(),
    name,
    initials: createInitials(name),
    level,
    winRate,
    wins,
    country: country.code,
    flag: country.flag,
    avatarGradient: pick(GRADIENTS),
    emoji: Math.random() > 0.55 ? pick(EMOJIS) : undefined,
  };
}

export const MATCHMAKING_STEPS = [
  'Buscando oponente...',
  'Encontrando mesa...',
  'Sincronizando sala...',
  'Oponente encontrado!',
];
