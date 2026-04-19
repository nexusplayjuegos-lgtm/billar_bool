// Designs profissionais de mesas de sinuca/bilhar
// Desenhados via Canvas 2D procedural

export interface TableDesign {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
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
    feltColor: '#0D001A',
    cushionColor: '#1A0033',
    woodColor: '#0D0D0D',
    pocketStyle: 'neon-purple',
    lineColor: '#CE93D8',
    glowEffect: true,
  },
];

export function getTableDesign(tableId: string): TableDesign | undefined {
  return TABLE_DESIGNS.find(d => d.id === tableId);
}
