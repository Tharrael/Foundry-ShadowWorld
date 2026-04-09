import { getModifiers } from "./modifier-engine.js";

export async function rollCheck({
  actor,
  attribute,
  skillLevel = 0,
  modifier = 0,
  mode = "normal"
}) {

  // 🧠 bezpečné načtení atributu
  const attrValue = actor.system.attributes?.[attribute] ?? 0;

   // 🔥 ITEM + EFFECT MODIFIERS
 const context = {
  type: skillLevel > 0 ? "skill" : "attribute",
  attribute: attribute,
  skillLevel: skillLevel
 };

  const extra = getModifiers(actor, context);

  // ➕ složení celé formule
  
  let partsOfFormula = [];

    // 🎲 základ
    if (mode === "advantage") partsOfFormula.push("2d10kh");
    else if (mode === "disadvantage") partsOfFormula.push("2d10kl");
    else partsOfFormula.push("1d10");

    // ➕ přidávej jen nenulové hodnoty
    if (attrValue !== 0) partsOfFormula.push(attrValue);
    if (skillLevel !== 0) partsOfFormula.push(skillLevel);
    if (modifier !== 0) partsOfFormula.push(modifier);
    if (extra !== 0) partsOfFormula.push(extra);

    // 🧮 výsledná formule
  const formula = partsOfFormula.join(" + ");

  // 🎲 vytvoření rollu
  const roll = await new Roll(formula).roll();

  // 💬 flavor (popisek v chatu)
  const parts = [];

    parts.push(`<b>${attribute.toUpperCase()} Roll</b>`);

    if (attrValue !== 0) parts.push(`Attribute: ${attrValue}`);
    if (skillLevel !== 0) parts.push(`Skill: ${skillLevel}`);
    if (modifier !== 0) parts.push(`Modifier: ${modifier}`);
    if (extra !== 0) parts.push(`Extra: ${extra}`);

  const flavor = `
  <b>${attribute.toUpperCase()} Roll</b><br>
  ${parts.slice(1).join(" | ")}
    `;

  // 📤 odeslání do chatu (Foundry styl)
  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: flavor
  });

  return roll.total;
}