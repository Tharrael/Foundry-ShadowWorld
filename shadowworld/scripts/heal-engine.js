export async function applyHealToToken(token, { heal }) {

  const actor = token.actor;
  if (!actor) return;

  let currentHP = actor.system.hp.current ?? 0;
  let maxHP = actor.system.hp.max ?? 1;
  let currentNL = actor.system.hp.nonLethal ?? 0;

  // 🧠 symetrický heal
  const newHP = Math.min(maxHP, currentHP + heal);
  const newNL = Math.max(0, currentNL - heal);

  await actor.update({
    "system.hp.current": newHP,
    "system.hp.nonLethal": newNL
  });

   await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ token }),
    content: `
      <div class="sw-chat-effect">
        <b>${token.name}</b><br>
        <span style="color:#3C850C">
          +${newHP - currentHP} HP
        </span>
        /
        <span style="color:#2550B8">
          -${currentNL - newNL} NL
        </span>
      </div>
    `
  });
}