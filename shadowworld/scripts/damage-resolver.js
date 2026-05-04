export function resolveDamage({ actor, damage, penetration = 0 }) {

  const armorLevel = actor.system.armor?.level || 0;

  // 🔥 PENETRACE
  const effectiveArmor = Math.max(0, armorLevel - penetration);

  // 🔥 REDUKCE
  const reduction = effectiveArmor * 2;

  let lethal = damage - reduction;
  let nonLethal = reduction;

  // 🔥 MINIMUM DAMAGE RULE
  const minDamage = Math.ceil(damage / 3);

  if (lethal < minDamage) {
    const diff = minDamage - lethal;

    lethal = minDamage;
    nonLethal = Math.max(0, nonLethal - diff);
  }

  return {
    lethal,
    nonLethal,
    armorUsed: effectiveArmor,
    penetration
  };
}