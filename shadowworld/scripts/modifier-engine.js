export function getModifiers(actor, context = {}) {
  const breakdown = [];

  // 🧩 ITEM BONUS
  if (context.item?.system?.bonus) {
    breakdown.push({
      label: context.item.name,
      value: Number(context.item.system.bonus) || 0
    });
  }

  // 🧩 PLACEHOLDER – efekty (budoucnost)
  const effects = actor.system?.effects ?? [];

  for (let e of effects) {
    const mods = e.modifiers ?? [];

    for (let m of mods) {
      if (!m.target || m.target === context.type || m.target === "all") {
        breakdown.push({
          label: e.name || "Effect",
          value: Number(m.value) || 0
        });
      }
    }
  }

  // 🔢 total
  const total = breakdown.reduce((sum, b) => sum + b.value, 0);

  return {
    total,
    breakdown
  };
}