'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store/userStore';
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
  const userId = session?.user?.id ?? null;

  const fetchCatalog = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke<{ items: Record<string, unknown>[] }>('get-shop-catalog', {});
      if (error) throw error;
      setState((prev) => ({
        ...prev,
        items: (data?.items || []).map(adaptShopItem),
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar catálogo';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
    }
  }, []);

  const fetchInventory = useCallback(async () => {
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
  }, [userId]);

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

        return {
          success: true,
          item: data.item ? adaptShopItem(data.item) : undefined,
          newCoins: data.newCoins,
          newCash: data.newCash,
        };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido.' };
      }
    },
    [userId, fetchInventory]
  );

  const equipItem = useCallback(
    async (itemId: string): Promise<boolean> => {
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
        return true;
      } catch (err) {
        console.error('[useShop] Erro ao equipar:', err);
        return false;
      }
    },
    [userId, fetchInventory]
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
