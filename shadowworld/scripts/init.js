console.log("INIT FILE LOADED");

import { ShadowWorldActorSheet } from "./actor-sheet.js";
import { ShadowWorldActorDataModel } from "./actor-model.js";
import { ShadowWorldActor } from "./actor.js";
import { ShadowWorldItemDataModel } from "./item-model.js";
import { ShadowWorldItemSheet } from "./item-sheet.js";

async function preloadTemplates() {
  const templates = [
     // 🔥 ACTOR PARTS  
    "systems/shadowworld/templates/actor/parts/attributes.hbs",
    "systems/shadowworld/templates/actor/parts/skills.hbs",
    "systems/shadowworld/templates/actor/parts/hp.hbs",
    "systems/shadowworld/templates/actor/parts/equipment.hbs",
    "systems/shadowworld/templates/actor/parts/items.hbs",
    "systems/shadowworld/templates/actor/parts/effects.hbs",

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
    "systems/shadowworld/templates/item/parts/utility.hbs"
  
    ];

    console.log("Templates preloaded", templates);
  return foundry.applications.handlebars.loadTemplates(templates);
}

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