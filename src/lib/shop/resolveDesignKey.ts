// Equipamento salvo no profile/local storage pode ser um UUID de
// shop_items (equip antigo, pré design_key) ou já o design_key.
// Resolve para o que o renderer entende; se não achar no mapa, devolve
// o valor original (já é design_key, ou catálogo ainda carregando).
export function resolveDesignKey(value: string, map: Map<string, string>): string {
  return map.get(value) ?? value;
}
