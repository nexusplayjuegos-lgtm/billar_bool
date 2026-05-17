import type { ShopItem } from '@/types';

const now = '2026-01-01T00:00:00.000Z';

function item(input: Omit<ShopItem, 'imageUrl' | 'isLimited' | 'availableFrom' | 'availableUntil' | 'quantityLimit' | 'quantitySold' | 'isActive' | 'createdAt'> & Partial<Pick<ShopItem, 'isLimited' | 'availableUntil'>>): ShopItem {
  return {
    ...input,
    imageUrl: null,
    isLimited: input.isLimited ?? false,
    availableFrom: now,
    availableUntil: input.availableUntil ?? null,
    quantityLimit: null,
    quantitySold: 0,
    isActive: true,
    createdAt: now,
  };
}

export const FALLBACK_SHOP_ITEMS: ShopItem[] = [
  item({ id: 'cue_beginner', category: 'cue', name: 'Taco Iniciante', description: 'Taco basico de madeira para iniciantes. Bom para aprender.', priceCoins: 0, priceCash: 0, rarity: 'common', stats: { power: 3, aim: 3, spin: 1, time: 1 } }),
  item({ id: 'cue_classic', category: 'cue', name: 'Taco Classico', description: 'Taco tradicional de mogno. Equilibrado e confiavel.', priceCoins: 500, priceCash: 0, rarity: 'common', stats: { power: 4, aim: 4, spin: 2, time: 2 } }),
  item({ id: 'cue_oak', category: 'cue', name: 'Taco de Carvalho', description: 'Madeira de carvalho envelhecida. Toque solido.', priceCoins: 800, priceCash: 0, rarity: 'common', stats: { power: 5, aim: 4, spin: 2, time: 2 } }),
  item({ id: 'cue_precision_pro', category: 'cue', name: 'Taco Profissional', description: 'Usado em campeonatos regionais. Precisao aprimorada.', priceCoins: 2000, priceCash: 0, rarity: 'rare', stats: { power: 6, aim: 6, spin: 4, time: 3 } }),
  item({ id: 'cue_ebony', category: 'cue', name: 'Taco de Ebano', description: 'Madeira preta densa. Peso perfeito para tacadas fortes.', priceCoins: 3500, priceCash: 0, rarity: 'rare', stats: { power: 7, aim: 5, spin: 5, time: 3 } }),
  item({ id: 'cue_bamboo', category: 'cue', name: 'Taco de Bambu', description: 'Leve e flexivel. Ideal para efeito.', priceCoins: 3000, priceCash: 0, rarity: 'rare', stats: { power: 5, aim: 7, spin: 6, time: 3 } }),
  item({ id: 'cue_carbon', category: 'cue', name: 'Taco de Carbono', description: 'Fibra de carbono de alta tecnologia. Leveza extrema.', priceCoins: 5000, priceCash: 50, rarity: 'epic', stats: { power: 7, aim: 8, spin: 6, time: 4 } }),
  item({ id: 'cue_titanium', category: 'cue', name: 'Taco de Titanio', description: 'Titanio aeroespacial. Forca maxima.', priceCoins: 7000, priceCash: 70, rarity: 'epic', stats: { power: 9, aim: 7, spin: 5, time: 4 } }),
  item({ id: 'cue_crystal', category: 'cue', name: 'Taco de Cristal', description: 'Design translucido com nucleo de grafite.', priceCoins: 6000, priceCash: 60, rarity: 'epic', stats: { power: 6, aim: 9, spin: 7, time: 5 } }),
  item({ id: 'cue_legendary', category: 'cue', name: 'Taco Lendario', description: 'O taco dos campeoes mundiais. Poder absoluto.', priceCoins: 10000, priceCash: 100, rarity: 'legendary', stats: { power: 10, aim: 10, spin: 8, time: 5 } }),
  item({ id: 'cue_dragon', category: 'cue', name: 'Taco do Dragao', description: 'Inspirado nos antigos mestres do Oriente. Efeito supremo.', priceCoins: 12000, priceCash: 120, rarity: 'legendary', stats: { power: 8, aim: 9, spin: 10, time: 6 } }),
  item({ id: 'cue_golden', category: 'cue', name: 'Taco Dourado', description: 'Revestimento de ouro 24k. Status maximo.', priceCoins: 15000, priceCash: 150, rarity: 'legendary', stats: { power: 9, aim: 10, spin: 9, time: 6 } }),

  item({ id: 'classic-green', category: 'table', name: 'Mesa Classica', description: 'Feltro verde tradicional. A mesa de todos os tempos.', priceCoins: 0, priceCash: 0, rarity: 'common', stats: {} }),
  item({ id: 'midnight-blue', category: 'table', name: 'Mesa Azul Real', description: 'Feltro azul elegante. Toque de classe.', priceCoins: 1000, priceCash: 0, rarity: 'rare', stats: {} }),
  item({ id: 'tournament-red', category: 'table', name: 'Mesa Vermelha', description: 'Feltro vermelho vibrante. Energia na mesa.', priceCoins: 3000, priceCash: 0, rarity: 'epic', stats: {} }),
  item({ id: 'galaxy-void', category: 'table', name: 'Mesa Dourada', description: 'Feltro preto com bordas douradas. Luxo absoluto.', priceCoins: 8000, priceCash: 0, rarity: 'legendary', stats: {} }),
  item({ id: 'emerald-pro', category: 'table', name: 'Mesa de Marmore', description: 'Tampo de marmore branco. Friccao unica.', priceCoins: 5000, priceCash: 0, rarity: 'epic', stats: {} }),
];
