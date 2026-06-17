import { supabase } from '@/lib/supabase/client';

let cachedMapPromise: Promise<Map<string, string>> | null = null;

async function fetchDesignKeyMap(): Promise<Map<string, string>> {
  try {
    const { data, error } = await supabase.functions.invoke<{ items: Record<string, unknown>[] }>(
      'get-shop-catalog',
      {}
    );
    if (error) throw error;
    const map = new Map<string, string>();
    for (const raw of data?.items ?? []) {
      const id = String(raw.id ?? '');
      const designKey = (raw as Record<string, unknown>).design_key ?? (raw as Record<string, unknown>).designKey;
      if (id && designKey) map.set(id, String(designKey));
    }
    return map;
  } catch {
    return new Map();
  }
}

// Singleton em memória: a primeira chamada (de qualquer componente, em
// qualquer parte do app) dispara o fetch; todas as seguintes na mesma
// sessão de página reusam a mesma Promise — só 1 chamada de rede.
export function getDesignKeyMap(): Promise<Map<string, string>> {
  if (!cachedMapPromise) {
    cachedMapPromise = fetchDesignKeyMap().then((map) => {
      // Falha ou catálogo vazio: não cacheia, permite retry na próxima chamada
      if (map.size === 0) cachedMapPromise = null;
      return map;
    });
  }
  return cachedMapPromise;
}
