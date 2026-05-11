// ============================================================
// Tipos do Sistema de Loja Real
// Bool Sinuca Premiere
// ============================================================

export type ShopCategory = 'cue' | 'table' | 'coin' | 'cash' | 'special' | 'avatar';
export type ShopRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface ShopItemStats {
  power?: number;
  aim?: number;
  spin?: number;
  time?: number;
}

export interface ShopItem {
  id: string;
  category: ShopCategory;
  name: string;
  description: string | null;
  priceCoins: number;
  priceCash: number;
  rarity: ShopRarity;
  stats: ShopItemStats;
  imageUrl: string | null;
  isLimited: boolean;
  availableFrom: string;
  availableUntil: string | null;
  quantityLimit: number | null;
  quantitySold: number;
  isActive: boolean;
  createdAt: string;
}

export interface PlayerInventoryItem {
  id: string;
  profileId: string;
  itemId: string;
  equipped: boolean;
  purchasedAt: string;
  expiresAt: string | null;
  item?: ShopItem;
}

export interface FlashDeal {
  id: string;
  itemId: string;
  discountPercent: number;
  startAt: string;
  endAt: string;
  maxPurchases: number | null;
  purchasesCount: number;
  isActive: boolean;
  createdAt: string;
  item?: ShopItem;
}

export interface ShopState {
  items: ShopItem[];
  inventory: PlayerInventoryItem[];
  flashDeals: FlashDeal[];
  isLoading: boolean;
  error: string | null;
}

export interface PurchaseResult {
  success: boolean;
  item?: ShopItem;
  newCoins?: number;
  newCash?: number;
  error?: string;
}

export function calculateDiscountedPrice(item: ShopItem, discountPercent: number): { coins: number; cash: number } {
  const multiplier = (100 - discountPercent) / 100;
  return {
    coins: Math.ceil(item.priceCoins * multiplier),
    cash: Math.ceil(item.priceCash * multiplier),
  };
}

export function getRarityColor(rarity: ShopRarity): string {
  switch (rarity) {
    case 'legendary': return 'text-amber-400 border-amber-400/50 bg-amber-500/10';
    case 'epic': return 'text-purple-400 border-purple-400/50 bg-purple-500/10';
    case 'rare': return 'text-blue-400 border-blue-400/50 bg-blue-500/10';
    default: return 'text-slate-400 border-slate-400/50 bg-slate-500/10';
  }
}

export function getRarityGradient(rarity: ShopRarity): string {
  switch (rarity) {
    case 'legendary': return 'from-amber-400 to-amber-600';
    case 'epic': return 'from-purple-400 to-purple-600';
    case 'rare': return 'from-blue-400 to-blue-600';
    default: return 'from-slate-400 to-slate-600';
  }
}

export function isItemOwned(inventory: PlayerInventoryItem[], itemId: string): boolean {
  return inventory.some((inv) => inv.itemId === itemId);
}

export function isItemEquipped(inventory: PlayerInventoryItem[], itemId: string): boolean {
  return inventory.some((inv) => inv.itemId === itemId && inv.equipped);
}

export function getEquippedItem(inventory: PlayerInventoryItem[], category: ShopCategory): PlayerInventoryItem | undefined {
  return inventory.find((inv) => inv.equipped && inv.item?.category === category);
}

export function formatPrice(coins: number, cash: number): string {
  if (coins > 0 && cash > 0) return `${coins.toLocaleString()} 🪙 / ${cash} C`;
  if (coins > 0) return `${coins.toLocaleString()} 🪙`;
  if (cash > 0) return `${cash} C`;
  return 'Grátis';
}
