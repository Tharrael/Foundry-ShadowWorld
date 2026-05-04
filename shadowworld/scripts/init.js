console.log("INIT FILE LOADED");

import { ShadowWorldActorSheet } from "./actor-sheet.js";
import { ShadowWorldActorDataModel } from "./actor-model.js";
import { ShadowWorldActor } from "./actor.js";
import { ShadowWorldItemDataModel } from "./item-model.js";
import { ShadowWorldItemSheet } from "./item-sheet.js";
import { getActorDexPenalty } from "./armor-engine.js";
import { getModifiers } from "./modifier-engine.js";
import { rollCheck } from "./roll-engine.js";

Hooks.once("init", () => {
  globalThis.rollCheck = rollCheck;
});

async function preloadTemplates() {
  const templates = [
     // 🔥 ACTOR PARTS  
    "systems/shadowworld/templates/actor/parts/attributes.hbs",
    "systems/shadowworld/templates/actor/parts/skills.hbs",
    "systems/shadowworld/templates/actor/parts/hp.hbs",
    "systems/shadowworld/templates/actor/parts/equipment.hbs",
    "systems/shadowworld/templates/actor/parts/items.hbs",
    "systems/shadowworld/templates/actor/parts/effects.hbs",
    
      // 🔥 ACTOR TABS
    "systems/shadowworld/templates/actor/tabs/tab-description.hbs",
    "systems/shadowworld/templates/actor/tabs/tab-combat.hbs",
    "systems/shadowworld/templates/actor/tabs/tab-inventory.hbs",
    "systems/shadowworld/templates/actor/tabs/tab-effects.hbs",
    "systems/shadowworld/templates/actor/tabs/tab-journal.hbs",
    
     // 🔥 ITEM PARTS
    "systems/shadowworld/templates/item/parts/item-header.hbs",
    "systems/shadowworld/templates/item/parts/item-description.hbs",
    "systems/shadowworld/templates/item/parts/weapon.hbs",
    "systems/shadowworld/templates/item/parts/armor.hbs",
    "systems/shadowworld/templates/item/parts/utility.hbs",
    "systems/shadowworld/templates/item/parts/ammo.hbs",
    
      // dialog templates
    "systems/shadowworld/templates/dialogs/roll-dialog.hbs"
  
    ];

    console.log("Templates preloaded", templates);
  return foundry.applications.handlebars.loadTemplates(templates);
}
Hooks.once("init", () => {
  const original = Combat.prototype.rollInitiative;
  Combat.prototype.rollInitiative = async function (ids, options = {}) {
    for (let id of ids){
      const combatant = this.combatants.get(id);
      if (!combatant) continue;
      const actor = combatant.actor;
      if (!actor) continue;
      const {openInitiativeDialog} = await import("./initiative.js");
      await openInitiativeDialog(this, combatant);
    }
    return this; // zruší defaultní initiative roll
  }});

Hooks.once("init", async function () {

  console.log("ShadowWorld | Init");
  
   // 🔥 HANDLEBARS HELPER
  Handlebars.registerHelper("eq", function (a, b) {
    return a === b;
  });
  
  // Preload Handlebars templates
  await preloadTemplates();
  
  console.log("templates loaded");

  // Actor class
  CONFIG.Actor.documentClass = ShadowWorldActor;

  // 🔥 SPRÁVNÁ registrace DataModelu
  CONFIG.Actor.dataModels["character"] = ShadowWorldActorDataModel;

  // 🔥 SPRÁVNÁ registrace DataModelu pro itemy
  CONFIG.Item.dataModels["weapon"] = ShadowWorldItemDataModel;
  CONFIG.Item.dataModels["armor"] = ShadowWorldItemDataModel;
  CONFIG.Item.dataModels["consumable"] = ShadowWorldItemDataModel;
  CONFIG.Item.dataModels["utility"] = ShadowWorldItemDataModel;
  CONFIG.Item.dataModels["ammo"] = ShadowWorldItemDataModel;

  CONFIG.Combat.initiative = {formula: "1d10", decimals: 0};

  // sheet
  Actors.unregisterSheet("core", ActorSheet);

  Actors.registerSheet("shadowworld", ShadowWorldActorSheet, {
    types: ["character"],
    makeDefault: true });
  
  // item sheet
  
  Items.unregisterSheet("core", ItemSheet);

  Items.registerSheet("shadowworld", ShadowWorldItemSheet, {  
  makeDefault: true});

});
Hooks.on("shadowworld.modifyRoll", (rollData) => {

  const result = getModifiers(rollData.actor, {
    item: rollData.item,
    type: rollData.skill > 0 ? "skill" : "attribute",
    attribute: rollData.attribute,
    skillLevel: rollData.skill
  });

  // 🔧 základní modifikátory
  rollData.effectBonus += result.total;
  rollData.parts.push(...result.breakdown);

  // 🛡️ ARMOR DEX PENALTY
  if (rollData.attribute === "dex") {

    const dexPenalty = getActorDexPenalty(rollData.actor);

    if (dexPenalty !== 0) {

      const penalty = -Math.abs(dexPenalty);

      rollData.effectBonus += penalty;

      rollData.parts.push({
        label: "Armor Penalty",
        value: penalty
      });
    }
  }
  // 🔫 AMMO EFFECTS
  if (rollData.item?.type === "weapon") {

    const ammoId = rollData.item.system.loadedAmmoId;
    if (!ammoId) return;

    const ammo = rollData.actor.items.get(ammoId);
    if (!ammo) return;

    // DAMAGE BONUS (string formula → NE do effectBonus!)
    if (ammo.system.damageBonus) {

      rollData.ammoDamageBonus = ammo.system.damageBonus;

      rollData.parts.push({
        label: "Ammo Damage",
        value: ammo.system.damageBonus // jen pro zobrazení
      });
    }

    // PENETRATION BONUS
    if (ammo.system.penetrationBonus) {
      rollData.penetrationBonus = 
        (rollData.penetrationBonus || 0) + ammo.system.penetrationBonus;
     }
  }

  console.log("MODIFIERS:", result);
});
Hooks.on("renderChatMessageHTML", (message, html) => {

  html.addEventListener("click", async (ev) => {

    // 🔥 DAMAGE
    const dmgBtn = ev.target.closest(".apply-damage");

    if (dmgBtn) {
      if (ev.detail === 0) return;

      ev.preventDefault();
      ev.stopPropagation();

      const damage = Number(dmgBtn.dataset.damage);
      const type = dmgBtn.dataset.type;
      const penetration = Number(dmgBtn.dataset.penetration);

      console.log("DATASET:", dmgBtn.dataset);

      const controlled = canvas.tokens.controlled;
      if (controlled.length === 0) {
        ui.notifications.warn("Select at least one token!");
        return;
      }

      const { applyDamageToToken } = await import("./damage-engine.js");

      for (let token of controlled) {
        if (!token.actor) continue;

        await applyDamageToToken(token, {
          damage,
          type,
          penetration
        });
      }

      
      dmgBtn.innerText = "Applied";
      return;
    }

    // 🩹 HEAL
    const healBtn = ev.target.closest(".apply-heal");

    if (healBtn) {
      if (ev.detail === 0) return;

      ev.preventDefault();
      ev.stopPropagation();

      const heal = Number(healBtn.dataset.heal);

      const controlled = canvas.tokens.controlled;
      if (controlled.length === 0) {
        ui.notifications.warn("Select at least one token!");
        return;
      }

      const { applyHealToToken } = await import("./heal-engine.js");

      for (let token of controlled) {
        if (!token.actor) continue;

        await applyHealToToken(token, { heal });
      }

      
      healBtn.innerText = "Applied";
    }

  });

});
Hooks.on("updateActor", async (actor, updateData) => {

  if (!foundry.utils.hasProperty(updateData, "system.hp")) return;

  const hp = actor.system.hp;
  if (!hp) return;

  const currentHP = hp.current ?? 0;
  const maxHP = hp.max ?? 1;
  const nonLethal = hp.nonLethal ?? 0;

  const isDown =
    (nonLethal >= maxHP) ||
    (currentHP <= 0);

  const alreadyDown = actor.getFlag("shadowworld", "isDown");

  if (!isDown && alreadyDown) {
    await actor.unsetFlag("shadowworld", "isDown");
  }

});
globalThis.swNotify = function (message, type = "info", duration = 2000) {

  ui.notifications[type](message);

  // 🔥 vezmeme poslední notifikaci v DOM
  const container = document.querySelector("#notifications");
  const notif = container?.lastElementChild;

  if (!notif) return;

  setTimeout(() => {
    notif.remove();
  }, duration);
};
Hooks.on("updateItem", async (item, changes) => {

  if (item.type !== "weapon") return;

  if (changes.system?.magazineSize !== undefined) {

    const newSize = changes.system.magazineSize;

    await item.update({
      "system.currentMagazine": newSize
    });

  }
});
Handlebars.registerHelper("effectLabel", function(type) {
  const labels = {
    damage: "Damage",
    heal: "Heal",
    penetration: "Pen"
  };

  return labels[type] || type;
});
Hooks.once("init", () => {

  globalThis.shadowworldRollAttribute = function(attribute, dc) {

      const tokens = canvas.tokens.controlled;
    
      if (!tokens.length) {
        const actor = game.user.character;
    
        if (!actor) {
          return ui.notifications.warn("Select a token or assign a character!");
        }
    
        return openRollDialog({
          actor,
          attribute: attribute,
          mode: "attribute",
          dc: dc
        });
      }
    
      for (let token of tokens) {
        const actor = token.actor;
        if (!actor) continue;
    
        openRollDialog({
          actor,
          attribute: attribute,
          mode: "attribute",
          dc: dc
        });
      }
    };

});
Hooks.on("renderChatMessage", (message, html) => {

  html.find(".sw-roll-attribute").click(ev => {
    const btn = ev.currentTarget;

    const attr = btn.dataset.attr;
    const dc = Number(btn.dataset.dc);

    const tokens = canvas.tokens.controlled;

    // 🔥 žádný token → fallback
    if (!tokens.length) {
      const actor = game.user.character;

      if (!actor) {
        return ui.notifications.warn("Select a token or assign a character!");
      }

      return openRollDialog({
        actor,
        attribute: attr,
        mode: "attribute",
        dc: dc
      });
    }

    // 🔥 více tokenů → loop
    for (let token of tokens) {
      const actor = token.actor;
      if (!actor) continue;

      openRollDialog({
        actor,
        attribute: attr,
        mode: "attribute",
        dc: dc
      });
    }

  });

});
function syncHP(actor) {
  const hp = actor.system.hp;
  if (!hp) return;

  actor.system.attributes = actor.system.attributes || {};
  actor.system.attributes.hp = {
    value: Number(hp.current) || 0,
    max: Number(hp.max) || 0
  };
}

// 🔁 při startu (initial sync)
Hooks.on("ready", () => {
  for (let actor of game.actors) {
    syncHP(actor);
  }
});

// 🔁 při každé změně
Hooks.on("updateActor", (actor) => {
  syncHP(actor);
});
Hooks.on("refreshToken", (token) => {
  const actor = token.actor;
  if (!actor) return;

  const hp = actor.system.hp;
  if (!hp) return;

  actor.system.attributes = actor.system.attributes || {};
  actor.system.attributes.hp = {
    value: Number(hp.current) || 0,
    max: Number(hp.max) || 0
  };
});