export function openRollDialog({
  actor,
  attribute = null,
  skillLevel = 0,
  skillName = null
}) {
    console.log("DIALOG RECEIVED ATTRIBUTE:", attribute);
  const attributes = actor.system.attributes || {};
  const isSkillRoll = skillName !== null;
    
  let attributeOptions = "";

  for (let key in attributes) {
        attributeOptions += `<option value="${key}" ${
            key === attribute ? "selected" : ""}>
        ${key.toUpperCase()}
        </option>`;
    }

  new Dialog({
    title: skillName
      ? `Skill Roll: ${skillName}`
      : `Roll (${attribute?.toUpperCase()})`,

    content: `
      <form>
        ${isSkillRoll ? `
        <div class="form-group">
          <label>Attribute</label>
          <select name="attribute">
            ${attributeOptions}
          </select>
        </div>
        `:`
        <input type="hidden" name="attribute" value="${attribute}">
        <p><strong>Attribute:</strong> ${attribute?.toUpperCase()}</p>
        `}
        <div class="form-group">
          <label>Modifier</label>
          <input type="number" name="modifier" value="0">
        </div>

        <div class="form-group">
          <label>Mode</label>
          <select name="mode">
            <option value="normal">Normal</option>
            <option value="advantage">Advantage</option>
            <option value="disadvantage">Disadvantage</option>
          </select>
        </div>

      </form>
    `,

    buttons: {
      roll: {
        label: "Roll",
        callback: async (html) => {

         const modifier = Number(html.find('[name="modifier"]').val()) || 0;
            const mode = html.find('[name="mode"]').val();
            const selectedAttr = html.find('[name="attribute"]').val();

            // 🔥 1️⃣ vytvoření rollData
            const rollData = {
                actor,
                attribute: selectedAttr,
                skill: skillLevel,
                modifier,
                mode,

                itemBonus: 0,
                effectBonus: 0,

                parts: [] // pro breakdown
            };

            // 🔥 2️⃣ HOOK – tady se napojí itemy/effects
            Hooks.call("shadowworld.modifyRoll", rollData);

            // 🔥 3️⃣ předání do engine
            const { rollCheck } = await import("./roll-engine.js");

            rollCheck({
                actor,
                attribute: rollData.attribute,
                skillLevel: rollData.skill,
                modifier: rollData.modifier,
                mode: rollData.mode,

                itemBonus: rollData.itemBonus,
                effectBonus: rollData.effectBonus,

                parts: rollData.parts
            }); 

        }
      }
    },

    default: "roll"

  }).render(true);
}