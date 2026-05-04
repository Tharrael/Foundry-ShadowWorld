export async function rollCheck({
  actor,
  attribute,
  skillName,
  skillLevel = 0,
  modifier = 0,
  mode = "normal",
  rollType = "",
  item = null,
  effectBonus = 0,
  dc = null,
  parts = []
}) {


  // 🧠 bezpečné načtení atributu
 const attrValue = actor.system.attributes?.[attribute] ?? 0;


   // 🔥 ITEM + EFFECT MODIFIERS
 
 const rollData = {
    actor,
    attribute,
    item,
    skill: skillLevel,
    modifier,
    effectBonus,
    parts: parts
  };
 Hooks.call("shadowworld.modifyRoll", rollData);
 const extra = rollData.effectBonus;

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

 // 🧾 BUILD FLAVOR
    let flavor = "";
    
    // 🎯 HEADER
    if (rollType === "initiative") {
      flavor = `<b>Initiative Roll</b>`;
    }
    else if (rollType === "attack") {
      flavor = `<b>Attack Roll</b>`;
    }
    else if (rollType === "skill") {
      flavor = `<b>Skill Check:</b> ${skillName}`;
    }
    else if (rollType === "attribute") {
      flavor = `<b>${attribute.toUpperCase()} Roll</b>`;
    }
    else {
      flavor = `<b>Roll</b>`;
    }
    
    // 🎲 základní breakdown
    const baseParts = [];
    
    if (attrValue !== 0) baseParts.push(`Attribute: ${attrValue}`);
    if (skillLevel !== 0) baseParts.push(`Skill: ${skillLevel}`);
    if (modifier !== 0) baseParts.push(`Modifier: ${modifier}`);
    
    // ➕ efekty
    if (rollData.parts && rollData.parts.length > 0) {
      const extraParts = rollData.parts
        .filter(p => p && p.label !== undefined && p.value !== undefined)
        .map(p => `${p.label}: ${p.value}`);
    
      baseParts.push(...extraParts);
    }
    
    // 🧾 přidání breakdownu
    if (baseParts.length > 0) {
      flavor += `<br>${baseParts.join(" | ")}`;
    }
    
    // 🔥 DC VYHODNOCENÍ (SPRÁVNĚ!)
    if (Number.isFinite(dc)) {
      const success = roll.total >= dc;
    
      flavor += `<br><b>DC ${dc}</b> → ${
        success
          ? '<span style="color:#3C850C"><b>SUCCESS</b></span>'
          : '<span style="color:#850B07"><b>FAIL</b></span>'
      }`;
    }

  // 📤 SEND TO CHAT
  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: flavor
    });
  console.log("ROLL TYPE:", rollType);
  console.log("ROLL MODE:", mode);
 return roll.total;
 
}
if (!globalThis.rollCheck) {
  globalThis.rollCheck = rollCheck;
}