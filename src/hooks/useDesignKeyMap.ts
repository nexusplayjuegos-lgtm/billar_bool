'use client';

import { useEffect, useState } from 'react';
import { getDesignKeyMap } from '@/lib/shop/designKeyMap';

export function useDesignKeyMap(): Map<string, string> {
  const [map, setMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let active = true;
    getDesignKeyMap().then((m) => { if (active) setMap(m); });
    return () => { active = false; };
  }, []);

  return map;
}
