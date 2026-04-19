// Designs profissionais de tacos inspirados em marcas reais (Predator, Mezz, Lucasi, McDermott)
// Desenhados via Canvas 2D procedural

export interface CueDesign {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  butt: { color: string; pattern: string };
  shaft: { color: string; gradient: string };
  wrap: { color: string; style: string };
  tip: string;
  jointRings: string[];
  glowColor?: string;
}

export const CUE_DESIGNS: CueDesign[] = [
  {
    id: 'maple-classic',
    name: 'Maple Classic',
    rarity: 'common',
    butt: { color: '#8B4513', pattern: 'plain' },
    shaft: { color: '#F5DEB3', gradient: '#DEB887' },
    wrap: { color: '#1a1a1a', style: 'linen' },
    tip: '#FFFFF0',
    jointRings: ['#C0C0C0'],
  },
  {
    id: 'venom-striker',
    name: 'Venom Striker',
    rarity: 'rare',
    butt: { color: '#006400', pattern: 'marble' },
    shaft: { color: '#1E90FF', gradient: '#00BFFF' },
    wrap: { color: '#111', style: 'stitched-blue' },
    tip: '#1E90FF',
    jointRings: ['#FFD700', '#FFD700'],
  },
  {
    id: 'predator-ghost',
    name: 'Predator Ghost',
    rarity: 'rare',
    butt: { color: '#E8E8E8', pattern: 'rings-grey' },
    shaft: { color: '#F8F8FF', gradient: '#DCDCDC' },
    wrap: { color: '#F0F0F0', style: 'linen-white' },
    tip: '#FFFFFF',
    jointRings: ['#333333', '#333333'],
  },
  {
    id: 'mezz-ec7',
    name: 'Mezz EC7',
    rarity: 'epic',
    butt: { color: '#1a1a1a', pattern: 'inlay-red-gold' },
    shaft: { color: '#1C1C1C', gradient: '#2D2D2D' },
    wrap: { color: '#8B0000', style: 'leather-red' },
    tip: '#2F4F4F',
    jointRings: ['#FFD700', '#FF4500', '#FFD700'],
  },
  {
    id: 'dragon-fire',
    name: 'Dragon Fire',
    rarity: 'epic',
    butt: { color: '#0D0D0D', pattern: 'flame-orange' },
    shaft: { color: '#8B0000', gradient: '#DC143C' },
    wrap: { color: '#1a1a1a', style: 'rings-orange' },
    tip: '#B8860B',
    jointRings: ['#FF4500', '#FFD700', '#FF4500'],
  },
  {
    id: 'lucasi-hybrid',
    name: 'Lucasi Hybrid',
    rarity: 'epic',
    butt: { color: '#1a1a1a', pattern: 'abalone' },
    shaft: { color: '#FFFFF0', gradient: '#F5F5DC' },
    wrap: { color: '#6B3A2A', style: 'leather-brown' },
    tip: '#F5F5DC',
    jointRings: ['#C0C0C0', '#FFD700', '#C0C0C0', '#FFD700'],
  },
  {
    id: 'shadow-legend',
    name: 'Shadow Legend',
    rarity: 'legendary',
    butt: { color: '#0D0D0D', pattern: 'crown-gold' },
    shaft: { color: '#2E003E', gradient: '#6A0DAD' },
    wrap: { color: '#2E003E', style: 'velvet-purple' },
    tip: '#FFD700',
    jointRings: ['#FFD700', '#FFD700', '#FFD700'],
    glowColor: '#9B30FF',
  },
  {
    id: 'diamond-elite',
    name: 'Diamond Elite',
    rarity: 'legendary',
    butt: { color: '#C0C0C0', pattern: 'diamond-sparkle' },
    shaft: { color: '#E8E8E8', gradient: '#A8A9AD' },
    wrap: { color: '#F0F0F0', style: 'chrome' },
    tip: '#FFFFFF',
    jointRings: ['#E8E8E8', '#A8A9AD', '#E8E8E8'],
    glowColor: '#FFFFFF',
  },
];

// Mapeia cue.id do mock para design.id
export function getCueDesign(cueId: string): CueDesign | undefined {
  const map: Record<string, string> = {
    'cue_beginner': 'maple-classic',
    'cue_venom_striker': 'venom-striker',
    'cue_precision_pro': 'predator-ghost',
    'cue_fire_storm': 'dragon-fire',
    'cue_ice_queen': 'lucasi-hybrid',
    'cue_golden_dragon': 'mezz-ec7',
    'cue_shadow_assassin': 'shadow-legend',
  };
  return CUE_DESIGNS.find(d => d.id === map[cueId]);
}
