export async function applyEffects({ actor, target, effects, item }) {

  let damageBonus = "";
  let penetrationBonus = 0;
  let healAmount = 0;
  let damageFormula = "";
  let damageType = "";

  // 🔥 MUSÍ BÝT TADY
  let healFormula = "";

  for (let effect of effects) {

    switch (effect.type) {

      case "damage":
        
        if (damageFormula) damageFormula += " + ";
        damageFormula += effect.value;

        damageType = effect.damageType || damageType;

        break;

      case "penetration":
        penetrationBonus += Number(effect.value);
        break;

      case "heal":

        // 🔥 skládání formule
        if (healFormula) healFormula += " + ";
        healFormula += effect.value;

        const roll = await new Roll(effect.value).evaluate({ async: true });
        healAmount += roll.total;

        break;
    }
  }

  return {
    damageBonus,
    penetrationBonus,
    healAmount,
    healFormula,
    damageFormula,
    damageType 
  };
}