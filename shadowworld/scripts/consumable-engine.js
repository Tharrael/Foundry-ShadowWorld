export async function useConsumable(actor, item) {

  if (!item.system.effects?.length) {
    ui.notifications.warn("No effects defined.");
    return false;
  }
  

  const { applyEffects } = await import("/systems/shadowworld/scripts/effect-engine.js");

  // 🎯 target (selected token nebo self)
  const token = canvas.tokens.controlled[0];
  const target = token?.actor || actor;

  const result = await applyEffects({
    actor,
    target,
    effects: item.system.effects,
    item
  });

  console.log("EFFECT RESULT:", result);

  let used = false;

  // 🔥 HEAL
  if (result.healFormula) {

    const roll = await new Roll(result.healFormula, actor.getRollData()).evaluate({ async: true });

    const amount = roll.total;

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `
        ${actor.name} used ${item.name} on ${target.name}<br><br>
        <button class="apply-heal"
          data-heal="${amount}">
          Apply Heal
        </button>
      `
    });

    used = true;
  }
  const module = await import("/systems/shadowworld/scripts/consumable-engine.js");
  console.log("MODULE:", module);

  // 💣 DAMAGE
  if (result.damageFormula) {

    const roll = await new Roll(result.damageFormula, actor.getRollData()).evaluate({ async: true });

    const rawDamage = roll.total;

    console.log("THROWABLE DAMAGE DEBUG:", {
      formula: result.damageFormula,
      rollTotal: roll.total,
      type: typeof roll.total
    });
    

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `
        ${actor.name} used ${item.name} <br>
        Type: ${result.damageType || "lethal"}<br><br>
        <button class="apply-damage" data-damage="${rawDamage}" data-type="${result.damageType || "lethal"}" data-penetration="${result.penetrationBonus ||0}">
          Apply Damage
        </button>
      `
    });

    used = true;
  }
  // damage, status, AoE…
  console.log("PEN RESULT:", result.penetrationBonus);

  return used;
}