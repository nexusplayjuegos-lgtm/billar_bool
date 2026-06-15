// Designs profissionais de mesas de sinuca/bilhar
// Desenhados via Canvas 2D procedural

export interface TableDesign {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  price: {
    coins: number;
    cash: number;
  };
  levelRequired?: number;
  feltColor: string;
  cushionColor: string;
  woodColor: string;
  pocketStyle: string;
  lineColor: string;
  glowEffect?: boolean;
}

export const TABLE_DESIGNS: TableDesign[] = [
  {
    id: 'classic-green',
    name: 'Classic Green',
    rarity: 'common',
    price: { coins: 0, cash: 0 },
    feltColor: '#1B5E20',
    cushionColor: '#4E342E',
    woodColor: '#5D4037',
    pocketStyle: 'leather-brown',
    lineColor: '#FFFFFF',
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    rarity: 'rare',
    price: { coins: 5000, cash: 0 },
    feltColor: '#0D1B5E',
    cushionColor: '#1A237E',
    woodColor: '#37474F',
    pocketStyle: 'chrome',
    lineColor: '#90CAF9',
  },
  {
    id: 'tournament-red',
    name: 'Tournament Red',
    rarity: 'rare',
    price: { coins: 5000, cash: 0 },
    feltColor: '#7B0000',
    cushionColor: '#4E342E',
    woodColor: '#3E2723',
    pocketStyle: 'leather-black',
    lineColor: '#FFCDD2',
  },
  {
    id: 'carbon-black',
    name: 'Carbon Black',
    rarity: 'epic',
    price: { coins: 15000, cash: 0 },
    levelRequired: 5,
    feltColor: '#0A0A0A',
    cushionColor: '#1C1C1C',
    woodColor: '#212121',
    pocketStyle: 'chrome-gold',
    lineColor: '#FFD700',
  },
  {
    id: 'emerald-pro',
    name: 'Emerald Pro',
    rarity: 'epic',
    price: { coins: 15000, cash: 0 },
    levelRequired: 5,
    feltColor: '#004D40',
    cushionColor: '#1B5E20',
    woodColor: '#1A237E',
    pocketStyle: 'gold',
    lineColor: '#A5D6A7',
  },
  {
    id: 'galaxy-void',
    name: 'Galaxy Void',
    rarity: 'legendary',
    price: { coins: 0, cash: 60 },
    levelRequired: 10,
    feltColor: '#0D001A',
    cushionColor: '#1A0033',
    woodColor: '#0D0D0D',
    pocketStyle: 'neon-purple',
    lineColor: '#CE93D8',
    glowEffect: true,
  },
];

const TABLE_ID_ALIASES: Record<string, string> = {
  table_classic_green: 'classic-green',
  table_blue_velvet: 'midnight-blue',
};

export function normalizeTableDesignId(tableId: string): string {
  return TABLE_ID_ALIASES[tableId] ?? tableId;
}

// Fallback designs por raridade para itens do banco sem design específico
const RARITY_FALLBACK: Record<string, string> = {
  common: 'classic-green',
  rare: 'midnight-blue',
  epic: 'carbon-black',
  legendary: 'galaxy-void',
};

export function getTableDesign(tableId: string, rarity?: string): TableDesign | undefined {
  const normalizedTableId = normalizeTableDesignId(tableId);
  const design = TABLE_DESIGNS.find(d => d.id === normalizedTableId);
  if (design) return design;
  console.warn(`[tableDesigns] ID de mesa não reconhecido: "${tableId}" (normalizado: "${normalizedTableId}"). Usando fallback.`);
  const fallbackId = rarity ? RARITY_FALLBACK[rarity] : undefined;
  return fallbackId ? TABLE_DESIGNS.find(d => d.id === fallbackId) : undefined;
}
