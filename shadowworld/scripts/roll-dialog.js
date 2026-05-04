export async function openRollDialog({
  actor,
  attribute = null,
  skillLevel = 0,
  skillName = null,
  item = null,
  mode = "skill",
  allowItemSelect = false,
  onRoll = null,
  dc = null,
  
}) {

  const isAttack = mode === "attack";
  const isAttributeRoll = mode === "attribute";

  // 🔹 Najdi default skill z itemu
  let defaultSkill = null;

  if (item && item.system.linkedSkill) {
    defaultSkill = actor.system.skills.find(
      s => s.name.toLowerCase() === item.system.linkedSkill.toLowerCase()
    );
  }

  if (defaultSkill) {
    attribute = defaultSkill.attribute;
    skillLevel = defaultSkill.level;
  }

  // 🔹 CONTEXT PRO TEMPLATE
  const context = {
    showAttribute: !isAttributeRoll,
    showSkill: !skillName,
    showSkillFixed: !!skillName,
    showWeapon: isAttack && item,
    showItemSelect: allowItemSelect,
    showSkillNone: mode === "initiative" || isAttributeRoll,

    skillName: skillName,
    weapon: item,
    isInitiative: mode==="initiative",

    attributes: Object.entries(actor.system.attributes || {}).map(([key]) => ({
      key,
      label: key.toUpperCase(),
      selected: key === (attribute || (mode === "initiative" ? "dex" : null))
    })),

    skills: (actor.system.skills || []).map(s => ({
      name: s.name,
      selected: s.name === item?.system.linkedSkill
    })),

    items: actor.items.contents
  };

  // 🔹 RENDER TEMPLATE
  const htmlContent = await renderTemplate(
    "systems/shadowworld/templates/dialogs/roll-dialog.hbs",
    context
  );

  // 🔹 DIALOG
  new Dialog({
    title: skillName || "Roll",

    content: htmlContent,

    buttons: {
      roll: {
        label: "Roll",
        callback: async (html) => {

          const modifier = Number(html.find('[name="modifier"]').val()) || 0;
          const rollType = mode;
          const rollMode = html.find('[name="mode"]').val() || "normal";
          const selectedAttr = html.find('[name="attribute"]').val() || attribute;
          
          let selectedSkillName = null;

            if (skillName) {
            selectedSkillName = skillName; // 🔥 fixní skill
            } else {
            selectedSkillName = html.find('[name="skill"]').val();
            }

          let skill = null;

          if (selectedSkillName) {
            skill = actor.system.skills.find(
              s => s.name.toLowerCase() === selectedSkillName.toLowerCase()
            );
          }

          // 🔹 Weapon / item selection
          const weaponId = html.find('[name="weapon"]').val();
          const selectedItemId = html.find('[name="item"]').val();

          let usedItem = null;

          if (selectedItemId) usedItem = actor.items.get(selectedItemId);
          else if (item) {usedItem = item;}
          else usedItem = null;

          console.log("USED ITEM:", usedItem?.name);          
          const rollData = {
            actor,
            attribute: skill?.attribute || selectedAttr,
            skill: skill?.level || skillLevel,
            item: usedItem,
            modifier,
            mode: rollMode,
            rollType: rollType,
            itemBonus: 0,
            effectBonus: 0,
            parts: []
          
          };

          console.log("ROLL DATA:", rollData);

          // 🔹 ROLL ENGINE
          const rollFn = globalThis.rollCheck;

          if (typeof rollFn !== "function") {
              return ui.notifications.error("rollCheck not available!");
          }

          const result = await rollFn({
            actor,
            attribute: rollData.attribute,
            skillLevel: rollData.skill,
            modifier: rollData.modifier,
            mode: rollMode,
            rollType: rollType,
            skillName: selectedSkillName,
            item: rollData.item,
            dc: Number.isFinite(dc) ? dc : null,
            effectBonus: rollData.effectBonus,
            parts: rollData.parts
          });
          if(onRoll) {
            await onRoll(result);
          }
          console.log("ROLLCHECK INPUT:", {itemBonus: rollData.itemBonus});
        }
      }
    },

    default: "roll"

  }).render(true);
}
globalThis.openRollDialog = openRollDialog;
