import { getActorArmor } from "./armor-engine.js";
export async function applyDamageToToken(token, { damage, type, penetration = 0 }) {

    if (!token.actor) return;

  const actor = token.actor;

  console.log("DAMAGE ENGINE INPUT:", {
        damage,
        type: type,
        actorHp: actor.system.hp
        });
    

  const armorLevel = getActorArmor(actor);
  const pen = Number(penetration)||0;

  const effectiveArmor = Math.max(0, armorLevel - pen);
  const reduction = effectiveArmor * 2;

  let lethal = 0;
  let nonLethal = 0;

    if (type === "lethal") {

        lethal = damage - reduction;
        nonLethal = reduction;

  const minDamage = Math.ceil(damage / 3);

    if (lethal < minDamage) {
        const diff = minDamage - lethal;

        lethal = minDamage;
        nonLethal = Math.max(0, nonLethal - diff);
    }

    } else if (type === "nonLethal") {

        // 🔥 čistý non-lethal zásah
        nonLethal = damage;
    }

  // 🧠 správné čtení hodnot
  const currentHP = actor.system.hp.current ?? 0;
  const currentNL = Number(actor.system.hp.nonLethal ?? 0);

  const newHP = Math.max(0, currentHP - lethal);
  const newNL = currentNL + nonLethal;

  
  // 🔥 KLÍČ – update přes token.document
  await actor.update({
    "system.hp.current": newHP,
    "system.hp.nonLethal": newNL
  });
  
  const maxHP = actor.system.hp.max ?? 1;

    const isDown =
        (newNL >= maxHP) ||
        (newHP <= 0);

    const wasDown = actor.getFlag("shadowworld", "isDown");

    if (isDown && !wasDown) {

        const combat = game.combat;
        const currentRound = combat?.round ?? 0;
        const deadline = currentRound + 3;

        await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `
            <div>
                <b>${token.name}</b> je vyřazen z boje.<br>
                Pozornost zdravotníka nutná do <b>${deadline}.</b> kola!
            </div>
        `
        });

    await actor.setFlag("shadowworld", "isDown", true);

    // 🔥 NPC → defeated
    if (!actor.hasPlayerOwner) {
        const combatants = game.combat?.getCombatantsByToken(token.id);
        const combatant = combatants?.[0];
        if (combatant) {
            await combatant.update({ defeated: true });
        }
    }
    }
  

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ token }),
    content: `
        <div class="sw-chat-effect">
        <b>${token.name}</b><br>
        <span style="color:#850B07">
            -${lethal} HP
        </span>
        /
        <span style="color:#2550B8">
            +${nonLethal} NL
        </span>
        </div>
    `
    });
  console.log("HP BEFORE:", actor.system.hp);
  console.log("Damage Type:", type);
  console.log("ARMOR ITEMS:", actor.items);
  console.log("ARMOR VALUE:", getActorArmor(actor));
}