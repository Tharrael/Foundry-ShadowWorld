// 🛡️ součet armor hodnoty
export function getActorArmor(actor) {
  return actor.items
    .filter(i => Boolean(i.system?.equipped) && i.system?.armor)
    .reduce((sum, i) => sum + Number(i.system.armor || 0), 0);
}

// 🧠 dex penalty z vybavení
export function getActorDexPenalty(actor) {
  return actor.items
    .filter(i => Boolean(i.system?.equipped))
    .reduce((sum, i) => sum + Number(i.system?.dexPenalty || 0), 0);
}