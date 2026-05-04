import { openRollDialog } from "./roll-dialog.js";

export async function openInitiativeDialog(combat, combatant) {

  const actor = combatant.actor;

  openRollDialog({
    actor,
    mode: "initiative",
    allowItemSelect: true,

    // 🔥 KLÍČ: callback override
    onRoll: async (result) => {

      await combat.setInitiative(combatant.id, result);

    }
  });
}