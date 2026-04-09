export function getModifiers(actor, context = {}) {

  let total = 0;

  // 🧩 ITEMS (placeholder)
  for (let item of actor.items || []) {

    const mods = item.system?.modifiers ?? [];

    for (let m of mods) {

      // 🎯 jednoduchá validace (zatím)
      if (!m.target || m.target === context.type || m.target === "all") {
        total += Number(m.value) || 0;
      }

    }
  }

  // 🧩 EFFECTS (placeholder pro budoucno)
  const effects = actor.system?.effects ?? [];

  for (let e of effects) {
    const mods = e.modifiers ?? [];

    for (let m of mods) {
      if (!m.target || m.target === context.type || m.target === "all") {
        total += Number(m.value) || 0;
      }
    }
  }

  return total;
}