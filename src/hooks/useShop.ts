'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store/userStore';
import { FALLBACK_SHOP_ITEMS } from '@/lib/shop/fallbackCatalog';
import { normalizeTableDesignId } from '@/lib/shop/tableDesigns';
import type { ShopItem, PlayerInventoryItem, FlashDeal, PurchaseResult, ShopCategory } from '@/types';

interface ShopState {
  items: ShopItem[];
  inventory: PlayerInventoryItem[];
  flashDeals: FlashDeal[];
  isLoading: boolean;
  error: string | null;
}

function snakeToCamel<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

function adaptShopItem(raw: Record<string, unknown>): ShopItem {
  const data = snakeToCamel(raw);
  return {
    id: String(data.id ?? ''),
    category: String(data.category ?? 'cue') as ShopItem['category'],
    name: String(data.name ?? ''),
    description: data.description ? String(data.description) : null,
    priceCoins: Number(data.priceCoins ?? 0),
    priceCash: Number(data.priceCash ?? 0),
    rarity: String(data.rarity ?? 'common') as ShopItem['rarity'],
    stats: (data.stats as ShopItem['stats']) || {},
    imageUrl: data.imageUrl ? String(data.imageUrl) : null,
    designKey: (data.designKey ?? raw['design_key']) ? String(data.designKey ?? raw['design_key']) : undefined,
    isLimited: Boolean(data.isLimited ?? false),
    availableFrom: String(data.availableFrom ?? ''),
    availableUntil: data.availableUntil ? String(data.availableUntil) : null,
    quantityLimit: data.quantityLimit ? Number(data.quantityLimit) : null,
    quantitySold: Number(data.quantitySold ?? 0),
    isActive: Boolean(data.isActive ?? true),
    createdAt: String(data.createdAt ?? ''),
  };
}

function adaptInventory(raw: Record<string, unknown>): PlayerInventoryItem {
  const data = snakeToCamel(raw);
  const item = data.item ? adaptShopItem(data.item as Record<string, unknown>) : undefined;
  return {
    id: String(data.id ?? ''),
    profileId: String(data.profileId ?? ''),
    itemId: String(data.itemId ?? ''),
    equipped: Boolean(data.equipped ?? false),
    purchasedAt: String(data.purchasedAt ?? ''),
    expiresAt: data.expiresAt ? String(data.expiresAt) : null,
    item,
  };
}

function adaptFlashDeal(raw: Record<string, unknown>): FlashDeal {
  const data = snakeToCamel(raw);
  const item = data.item ? adaptShopItem(data.item as Record<string, unknown>) : undefined;
  return {
    id: String(data.id ?? ''),
    itemId: String(data.itemId ?? ''),
    discountPercent: Number(data.discountPercent ?? 0),
    startAt: String(data.startAt ?? ''),
    endAt: String(data.endAt ?? ''),
    maxPurchases: data.maxPurchases ? Number(data.maxPurchases) : null,
    purchasesCount: Number(data.purchasesCount ?? 0),
    isActive: Boolean(data.isActive ?? true),
    createdAt: String(data.createdAt ?? ''),
    item,
  };
}

export function useShop() {
  const [state, setState] = useState<ShopState>({
    items: [],
    inventory: [],
    flashDeals: [],
    isLoading: true,
    error: null,
  });

  const { session, isSessionLoaded } = useUserStore();
  const { profile, isGuest, buyCue, equipCue, buyTable, equipTable } = useUserStore();
  const userId = session?.user?.id ?? null;

  const buildLocalInventory = useCallback(
    (items: ShopItem[]): PlayerInventoryItem[] => {
      const localProfile = useUserStore.getState().profile;
      const now = new Date().toISOString();
      const cueItems = localProfile.equipment.ownedCues.map((itemId) => {
        const catalogItem = items.find((i) => i.id === itemId);
        return {
          id: `local-${localProfile.id}-${itemId}`,
          profileId: localProfile.id,
          itemId,
          equipped: localProfile.equipment.currentCue === itemId ||
            (catalogItem?.designKey != null && localProfile.equipment.currentCue === catalogItem.designKey),
          purchasedAt: now,
          expiresAt: null,
          item: catalogItem,
        };
      });
      const tableItems = localProfile.equipment.ownedTables.map((itemId) => {
        const catalogItem = items.find((i) => i.id === itemId);
        return {
          id: `local-${localProfile.id}-${itemId}`,
          profileId: localProfile.id,
          itemId,
          equipped: localProfile.equipment.currentTable === itemId ||
            (catalogItem?.designKey != null && localProfile.equipment.currentTable === catalogItem.designKey),
          purchasedAt: now,
          expiresAt: null,
          item: catalogItem,
        };
      });
      return [...cueItems, ...tableItems];
    },
    []
  );

  const fetchCatalog = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke<{ items: Record<string, unknown>[] }>('get-shop-catalog', {});
      if (error) throw error;
      const remoteItems = (data?.items || []).map(adaptShopItem);
      setState((prev) => ({
        ...prev,
        items: remoteItems.length > 0 ? remoteItems : FALLBACK_SHOP_ITEMS,
        inventory: !userId && isGuest ? buildLocalInventory(remoteItems.length > 0 ? remoteItems : FALLBACK_SHOP_ITEMS) : prev.inventory,
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar catálogo';
      console.warn('[useShop] Falha ao buscar catálogo remoto, usando fallback local:', message);
      setState((prev) => ({
        ...prev,
        items: FALLBACK_SHOP_ITEMS,
        inventory: !userId && isGuest ? buildLocalInventory(FALLBACK_SHOP_ITEMS) : prev.inventory,
        error: null,
        isLoading: false,
      }));
    }
  }, [buildLocalInventory, isGuest, userId]);

  const fetchInventory = useCallback(async () => {
    if (!userId && isGuest) {
      setState((prev) => ({ ...prev, inventory: buildLocalInventory(prev.items.length > 0 ? prev.items : FALLBACK_SHOP_ITEMS) }));
      return;
    }
    if (!userId) return;
    try {
      const { data, error } = await supabase.functions.invoke<{ inventory: Record<string, unknown>[] }>('get-inventory', {});
      if (error) throw error;
      setState((prev) => ({
        ...prev,
        inventory: (data?.inventory || []).map(adaptInventory),
      }));
    } catch (err) {
      console.error('[useShop] Erro ao buscar inventário:', err);
    }
  }, [buildLocalInventory, isGuest, userId]);

  const fetchFlashDeals = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke<{ deals: Record<string, unknown>[] }>('get-flash-deals', {});
      if (error) throw error;
      setState((prev) => ({
        ...prev,
        flashDeals: (data?.deals || []).map(adaptFlashDeal),
      }));
    } catch (err) {
      console.error('[useShop] Erro ao buscar deals:', err);
    }
  }, []);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    await Promise.all([fetchCatalog(), fetchInventory(), fetchFlashDeals()]);
  }, [fetchCatalog, fetchInventory, fetchFlashDeals]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const buyItem = useCallback(
    async (itemId: string, dealId?: string): Promise<PurchaseResult> => {
      const item = state.items.find((catalogItem) => catalogItem.id === itemId);
      if (!item) return { success: false, error: 'Item não encontrado.' };

      if (!userId && isGuest) {
        if (item.priceCoins > 0 && profile.currencies.coins < item.priceCoins) {
          return { success: false, error: 'Moedas insuficientes.' };
        }
        if (item.priceCash > 0 && profile.currencies.cash < item.priceCash) {
          return { success: false, error: 'Cash insuficiente.' };
        }

        if (item.category === 'cue') {
          await buyCue(item.id, item.priceCoins);
          await equipCue(item.id);
        } else if (item.category === 'table') {
          await buyTable(item.id, { coins: item.priceCoins, cash: item.priceCash });
        }

        setState((prev) => ({
          ...prev,
          inventory: buildLocalInventory(prev.items.length > 0 ? prev.items : FALLBACK_SHOP_ITEMS),
        }));

        return {
          success: true,
          item,
          newCoins: Math.max(0, profile.currencies.coins - item.priceCoins),
          newCash: Math.max(0, profile.currencies.cash - item.priceCash),
        };
      }

      if (!userId) return { success: false, error: 'Não autenticado.' };

      try {
        const { data, error } = await supabase.functions.invoke<{
          success: boolean;
          item?: Record<string, unknown>;
          newCoins?: number;
          newCash?: number;
          error?: string;
        }>('buy-item', {
          body: { item_id: itemId, deal_id: dealId || null },
        });

        if (error || !data?.success) {
          return { success: false, error: data?.error || error?.message || 'Erro na compra.' };
        }

        // Recarregar inventário
        await fetchInventory();
        const purchasedItem = data.item ? adaptShopItem(data.item) : item;
        useUserStore.setState((current) => {
          const newCoins = data.newCoins ?? Math.max(0, current.profile.currencies.coins - purchasedItem.priceCoins);
          const newCash = data.newCash ?? Math.max(0, current.profile.currencies.cash - purchasedItem.priceCash);
          const equipment = { ...current.profile.equipment };
          if (purchasedItem.category === 'cue') {
            equipment.ownedCues = Array.from(new Set([...equipment.ownedCues, purchasedItem.id]));
            equipment.currentCue = purchasedItem.id;
          }
          if (purchasedItem.category === 'table') {
            const normalizedTable = normalizeTableDesignId(purchasedItem.id);
            equipment.ownedTables = Array.from(new Set([...equipment.ownedTables, normalizedTable]));
            equipment.currentTable = normalizedTable;
          }
          return {
            profile: {
              ...current.profile,
              currencies: { ...current.profile.currencies, coins: newCoins, cash: newCash },
              equipment,
            },
          };
        });

        return {
          success: true,
          item: purchasedItem,
          newCoins: data.newCoins,
          newCash: data.newCash,
        };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido.' };
      }
    },
    [buildLocalInventory, buyCue, buyTable, equipCue, fetchInventory, isGuest, profile.currencies.cash, profile.currencies.coins, state.items, userId]
  );

  const equipItem = useCallback(
    async (itemId: string): Promise<boolean> => {
      const item = state.items.find((catalogItem) => catalogItem.id === itemId);
      if (!userId && isGuest && item) {
        if (item.category === 'cue') await equipCue(itemId, item.designKey);
        if (item.category === 'table') await equipTable(itemId, item.designKey);
        setState((prev) => ({
          ...prev,
          inventory: buildLocalInventory(prev.items.length > 0 ? prev.items : FALLBACK_SHOP_ITEMS),
        }));
        return true;
      }

      if (!userId) return false;

      try {
        const { data, error } = await supabase.functions.invoke<{ success: boolean }>('equip-item', {
          body: { item_id: itemId },
        });

        if (error || !data?.success) {
          console.error('[useShop] Erro ao equipar:', error);
          return false;
        }

        await fetchInventory();
        if (item) {
          const designKey = item.designKey ?? (item.category === 'table' ? normalizeTableDesignId(item.id) : item.id);
          useUserStore.setState((current) => {
            const equipment = { ...current.profile.equipment };
            if (item.category === 'cue') equipment.currentCue = designKey;
            if (item.category === 'table') equipment.currentTable = designKey;
            return { profile: { ...current.profile, equipment } };
          });
          if (item.category === 'cue') {
            await supabase.from('profiles').update({ current_cue: designKey }).eq('id', userId);
          } else if (item.category === 'table') {
            await supabase.from('profiles').update({ current_table: designKey }).eq('id', userId);
          }
        }
        return true;
      } catch (err) {
        console.error('[useShop] Erro ao equipar:', err);
        return false;
      }
    },
    [buildLocalInventory, equipCue, equipTable, fetchInventory, isGuest, state.items, userId]
  );

  const getItemsByCategory = useCallback(
    (category: ShopCategory) => {
      return state.items.filter((item) => item.category === category);
    },
    [state.items]
  );

  const getItemDeal = useCallback(
    (itemId: string): FlashDeal | undefined => {
      return state.flashDeals.find((d) => d.itemId === itemId);
    },
    [state.flashDeals]
  );

  return {
    items: state.items,
    inventory: state.inventory,
    flashDeals: state.flashDeals,
    isLoading: state.isLoading,
    error: state.error,
    refresh,
    buyItem,
    equipItem,
    getItemsByCategory,
    getItemDeal,
  };
}
