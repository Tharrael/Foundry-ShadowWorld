import { openRollDialog } from "./roll-dialog.js";
export class ShadowWorldActorSheet extends ActorSheet {

    async _chooseSkillAttribute(index) {

    const attributes = this.actor.system.attributes || {};

    let options = "";

    for (let key in attributes) {
      options += `<option value="${key}">${key.toUpperCase()}</option>`;
    }

    new Dialog({
      title: "Zvol standardní atribut",

      content: `
        <form>
          <div class="form-group">
            <label>Atribut</label>
            <select name="attribute">
              ${options}
            </select>
          </div>
        </form>
      `,

      buttons: {
        ok: {
          label: "OK",
          callback: async (html) => {

            const attr = html.find('[name="attribute"]').val();

            console.log("SELECTED ATTRIBUTE:", attr); // 👈 DEBUG

            // 🔥 KRITICKÁ ČÁST
            const skills = Array.from(this.actor.system.skills || []);

            skills[index] = {
              ...skills[index],
              attribute: attr
            };

            console.log("UPDATED SKILL:", skills[index]); // 👈 DEBUG

            await this.actor.update({
              "system.skills": skills
            });
            console.log("AFTER UPDATE ACTOR:", this.actor.system.skills);
          }
        }
      }

    })
    .render(true);
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["shadowworld", "sheet", "actor"],
      template: "systems/shadowworld/templates/actor/actor-sheet.hbs",
      width: 900,
      height: 700,
      submitOnChange: true,
      submitOnClose: true,

      tabs: [
        {
          navSelector: ".tabs",
          contentSelector: ".sheet-body",
          initial: "description"
        }
      ]

    });
  }

  async _updateObject(event, formData) {
    return super._updateObject(event, formData)
  }

  /** @override */
  async getData() {
    const context = await super.getData();
    
    console.log("GET DATA:", context);
    console.log("RENDER ACTOR SHEET START");

    const equipped = this.actor.items.filter(i => i.system.equipped);

    context.counts = {
      weapon: equipped.filter(i => i.type === "weapon").length,
      armor: equipped.filter(i => i.type === "armor").length,
      utility: equipped.filter(i => i.type === "utility" && !i.system.consumable).length,
      consumable: equipped.filter(i => i.system.consumable).length
    };
    

    const system = this.actor.system || {};

    context.system = system;
    
    context.effects = this.actor.effects.contents;

    // Atributes -> list
      context.attributesList = Object.entries(system.attributes || {})
    .map(([key, value]) => ({ key, value }));

    // labels
    context.attributeLabels = {
      str: "STR",
      con: "CON",
      dex: "DEX",
      int: "INT",
      wis: "WIS",
      cha: "CHA"
      };

    // 🔥 LABELY PRO LEVELY SKILLŮ
    const levelLabels = {
        1: "Začátečník",
        2: "Expert",
        3: "Mistr",
        4: "Velmistr",
        5: "Godlike"
        };

    context.levelLabels = levelLabels;
    
    context.isGM = game.user.isGM;    

    // 🔥 BEZPEČNOSTNÍ POJISTKA (kdyby něco nebylo inicializované)
    system.skills ??= [];
    system.skillLimits ??= {};

    // 🔥 seskupení skillů podle levelu
    const skillsByLevel = {};
    
    const skillsArray = Array.from(system.skills ?? []);

   for (let lvl = 1; lvl <= 5; lvl++) {
    skillsByLevel[lvl] = skillsArray
      .map((s, i) => ({ ...s, _index: i }))
      .filter(s => s.level === lvl);
    }
    const sortedSkillLevels = Object.keys(skillsByLevel)
      .map(Number)
      .sort((a, b) => b - a); // 🔥 5 → 1

    context.skillsByLevelSorted = sortedSkillLevels.map(level => ({
      level,
      skills: skillsByLevel[level]
    }));

    // 👉 pošleme do template
    context.skillsByLevel = skillsByLevel;
    
    const getGroupRank = (item) => {
      if (item.type === "weapon") return 0;
      if (item.type === "armor") return 1;
      if (item.type === "utility" && !item.system?.consumable) return 2;
      if (item.system?.consumable) return 3;
      if (item.type === "ammo") return 4;
      return 99;
    };

    const items = [...this.actor.items.contents].sort((a, b) => {
      const groupDiff = getGroupRank(a) - getGroupRank(b);
      if (groupDiff !== 0) return groupDiff;
      return (a.sort ?? 0) - (b.sort ?? 0);
    });
    context.items = items;
    context.equippedItems = items.filter(i => i.system?.equipped===true);
    context.ammoItems = items.filter(i => i.type === "ammo");

    console.log("RAW ITEMS:", items);
    

    items.forEach(i => {
      console.log("ITEM Equipped?:", i.name, i.system?.equipped);
      console.log("type checked:", i.name, i.system?.equipped, typeof i.system?.equipped);
    });

    

    
    
    console.log("QUIPPED ITEMS:", context.equippedItems);

    return context;
    
  }
  
  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    console.log("ShadowWorld Sheet loaded");
    
    // ROLL ATTRIBUTE
    html.find(".roll-attribute").click(ev => {

      const attr = ev.currentTarget.dataset.attr;

      openRollDialog({
        actor: this.actor,
        attribute: attr,
        mode: "attribute"});
    });
    // ➕ ADD SKILL
    html.find(".add-skill").click(async (event) => {

        const level = Number(event.currentTarget.dataset.level);
        let skills = Array.from(this.actor.system.skills ?? []);
        const limits = this.actor.system.skillLimits || {};
        const currentCount = skills.filter(s => s.level === level).length;
        const max = limits[level] ?? 0;

            if (currentCount >= max) {
            ui.notifications.warn(`Max skills for level ${level} reached!`);
            return;
            }
        skills.push({
            name: "",
            level: level
            });

    await this.actor.update({
        "system.skills": skills,
        });
    });
  // uložení jména skillu
    html.find(".skill-name").change(async ev => {

      const index = Number(ev.currentTarget.dataset.index);
      const value = ev.currentTarget.value;

      const skills = Array.from(this.actor.system.skills || []);

      skills[index] = {
        ...skills[index],
        name: value
        };

      await this.actor.update({
        "system.skills": skills
        });

    });

  // ❌ DELETE SKILL
  html.find(".delete-skill").click(async (event) => {

    const index = Number(event.currentTarget.dataset.index);

    let skills = Array.from(this.actor.system.skills ?? []);

      if (index < 0 || index >= skills.length) return;

    const name = skills[index]?.name || "tento skill";

    new Dialog({
     title: "Potvrzení",
      content: `<p>Opravdu smazat skill "<b>${name}</b>"?</p>`,
      buttons: {
        yes: {
          label: "ANO",
          callback: async () => {
            skills.splice(index, 1);

            await this.actor.update({
              "system.skills": skills
            });
         }
        },
        no: {
          label: "NE"
        }
      },
      default: "no"
    }).render(true);

  });
  html.find(".roll-skill").click(ev => {

    const index = Number(ev.currentTarget.dataset.index);
    const actor = this.actor;
    const skills = actor.toObject().system.skills || [];
    const skill = skills[index];

     console.log("CLICKED INDEX:", index);
      console.log("ALL SKILLS:", skills);
      console.log("CLICKED SKILL:", skill);

    if (!skill) return;

   openRollDialog({
    actor: this.actor,
    skillName: skill.name,
    attribute: skill.attribute,
    mode: "skill",
    allowItemSelect: true
    });

    console.log("SKILL ATTRIBUTE:", skill.attribute);
    console.log("SKILL:", skill);

  });
  
  html.find(".skill-name").keydown(async ev => {
    if (ev.key !== "Enter") return;
    ev.preventDefault();

    const index = Number(ev.currentTarget.dataset.index);
    const value = ev.currentTarget.value;
    const skills = Array.from(this.actor.system.skills || []);
    const skill = skills[index];

    if (!skill || skill.attribute) return;

    this._chooseSkillAttribute(index);

    skills[index] = {
      ...skills[index], // 🔥 KLÍČ
      name: value
    };

    await this.actor.update({
      "system.skills": skills
    });

  });

  html.find('[name^="system.skillLimits"]').change(async (ev) => {

    const input = ev.currentTarget;

    const path = input.name; // např. system.skillLimits.1
    const value = Number(input.value) || 0;

    console.log("GM LIMIT UPDATE:", path, value);

    await this.actor.update({
      [path]: value
    });

  });

  html.find('[name^="system.attributes"]').change(async (ev) => {

    const input = ev.currentTarget;

    const path = input.name; // např. system.attributes.dex
    const value = Number(input.value) || 0;

    console.log("ATTRIBUTE UPDATE:", path, value);

    await this.actor.update({
      [path]: value
    });

  });

  html.find('[name^="system.hp"]').change(async (ev) => {

    const input = ev.currentTarget;

    const path = input.name; // např. system.attributes.dex
    const value = Number(input.value) || 0;

    console.log("HP UPDATE:", path, value);

    await this.actor.update({
      [path]: value
    });

  });
  // quipped checkbox
  html.find(".item-equipped").change(async ev => {
    const checkbox = ev.currentTarget;

    const itemId = checkbox.dataset.itemId;
    const item = this.actor.items.get(itemId);

    if (!item) return;

    const value = checkbox.checked;

    console.log("UPDATING EQUIPPED:", item.name, value);

    // 🔥 POUZE PŘI ZAPÍNÁNÍ (equip)
    if (value) {

      const equipped = this.actor.items.filter(i => i.system.equipped);

      const limits = {
        weapon: 2,
        armor: 1,
        utility: 4,
        consumable: 4
      };

      let type = item.type;

      // 🔧 consumable override
      if (item.system.consumable) {
        type = "consumable";
      }

      const currentlyEquipped = equipped.filter(i => {
        if (type === "consumable") return i.system.consumable;
        if (type === "utility") return i.type === "utility" && !i.system.consumable;
        return i.type === type;
      });

      // 🚫 LIMIT
      if (currentlyEquipped.length >= limits[type]) {

        if (type === "weapon") {
          ui.notifications.warn("Již vybaveny dvě zbraně.");
        } else {
          ui.notifications.warn(`Již vybaveno ${limits[type]} předmětů typu ${type}.`);
        }

        // ❗ vrátí checkbox zpět
        checkbox.checked = false;
        return;
      }
    }

    // ✅ UPDATE
    await this.actor.updateEmbeddedDocuments("Item", [{
      _id: itemId,
      "system.equipped": value
    }]);

    this.render(true);
  });
  

  // DELETE ITEM
  html.find(".item-delete").click(async ev => {
    const itemId = ev.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);

    if (!item) return;

    await item.delete();
  });
  html.find(".roll-weapon").click(async ev => {

     if (ev.originalEvent?.detail === 0) return;

      ev.preventDefault();

    const itemId = ev.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);

    let penetration = item.system?.penetration || 0;

    const ammoId = item.system.loadedAmmoId;
    if (ammoId) {
      const ammo = this.actor.items.get(ammoId);

      
    }

    const damageType = item.system?.damageType || "lethal";

    // 🔥 BASE DAMAGE
    let formula = item.system.damage;

    // 🔫 AMMO BONUS
    
      if (ammoId) {
        const ammo = this.actor.items.get(ammoId);

        const {applyEffects} = await import("./effect-engine.js");
        let effectsResult = {
            damageFormula: "",
            penetrationBonus: 0
          };

          if (ammo?.system.effects?.length) {
            effectsResult = await applyEffects({
              actor: this.actor,
              target: null,
              effects: ammo.system.effects,
              item: ammo
            });
          }

          if (effectsResult.damageFormula) {
            formula += `+${effectsResult.damageFormula}`;
          }
          penetration += effectsResult.penetrationBonus;
                }

    // 🎲 ROLL
    const roll = await new Roll(formula, this.actor.getRollData()).evaluate({ async: true });

    const rawDamage = roll.total;

    // 🎯 target (prozatím první target)
    const target = game.user.targets.first();
    const targetId = target?.actor?.id || null;

    // 💬 Chat message s tlačítkem
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `
      ${item.name} (${item.system.damageType}) - Damage<br>
      Penetration: ${penetration}<br><br>
      <button class="apply-damage"
        data-damage="${rawDamage}"
        data-type="${item.system.damageType}"
        data-penetration="${penetration}">
        Damage
      </button>
    `
    });
  });
  html.find(".roll-heal").click(async ev => {

    const itemId = ev.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);

    if (!item) return;

    const { applyEffects } = await import("/systems/shadowworld/scripts/effect-engine.js");

    // 🔥 z effects vytáhneme HEAL FORMULI
    let healFormula = "";

    for (let effect of (item.system.effects || [])) {
      if (effect.type === "heal" && effect.value) {
        if (healFormula) {
          healFormula += " + ";
        }
        healFormula += effect.value;
      }
    }

    // fallback (když nic není)
    if (!healFormula) {
      ui.notifications.warn("No heal effect!");
      return;
    }

    // 🎲 FOUNDY ROLL
    const roll = await new Roll(healFormula, this.actor.getRollData()).evaluate({ async: true });

    const amount = roll.total;

    // 💬 CHAT MESSAGE (Foundry styl)
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `
        ${item.name} - Heal<br>
        Formula: ${healFormula}<br><br>
        <button class="apply-heal"
          data-heal="${amount}">
          Apply Heal
        </button>
      `
    });

  });
  html.find(".item-damage-type").change(async ev => {
    const select = ev.currentTarget;

    const itemId = select.dataset.itemId;
    const value = select.value;

    await this.actor.updateEmbeddedDocuments("Item", [
      {
        _id: itemId,
        "system.damageType": value
      }
    ]);
  });
  html.find(".roll-attack").click(async ev => {
    const itemId = ev.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);

    const equipped = [...this.actor.items.values()]
    .filter(i => i.system?.equipped);

    const ammoId = item.system.loadedAmmoId;

    let mag = item.system.currentMagazine || 0;
    console.log("kapacita zásobníku:", mag);

    if (mag <= 0) {
      swNotify("Reload!", "warn", 3000);;
      return;
    }
    await item.update({
      "system.currentMagazine": mag - 1
    });

    if (ammoId) {
      const ammo = this.actor.items.get(ammoId);

      if (ammo) {
        let qty = ammo.system.quantity || 0;

        if (qty > 0) {

          const newQty = qty - 1;

          await ammo.update({
            "system.quantity": newQty
          });

          // 🔥 AUTO DE-SELECT
          if (newQty <= 0) {
            await item.update({
              "system.loadedAmmoId": ""
            });

            ui.notifications.info(`${ammo.name} depleted`);
          }

        } else {
          ui.notifications.warn("Out of ammo!");
        }
      }
    }

   openRollDialog({
    actor: this.actor,
    item: item,
    mode: "attack"
    });
  });

  html.find(".item-skill").change(async ev => {
    const select = ev.currentTarget;

    const itemId = select.dataset.itemId;
    const value = select.value;

    const result = await this.actor.updateEmbeddedDocuments("Item", [
      {
        _id: itemId,
        system: {
          linkedSkill: value
        }
      }
    ]);
  });
  html.on("click", ".use-item", async ev => {

    ev.preventDefault();
    ev.stopPropagation();

    const itemId = ev.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);

    if (!item || !item.system.consumable) return;

    let charges = Number(item.system.charges || 0);

    if (charges <= 0) {
      ui.notifications.warn("No charges left!");
      return;
    }

    const { useConsumable } = await import("/systems/shadowworld/scripts/consumable-engine.js");

    const success = await useConsumable(this.actor, item);

    if (!success) return;

    const newCharges = charges - 1;

    let updateData = {
      "system.charges": newCharges
    };

    // 🔥 auto unequip při vyčerpání
    if (newCharges <= 0) {
      updateData["system.equipped"] = false;
    }

    await item.update(updateData);

    console.log("CONSUMABLE USED:", item.name);

  });
  
  html.on("change", ".item-ammo", async ev => {

    const select = ev.currentTarget;

    const itemId = select.dataset.itemId;
    const ammoId = select.value;

    const item = this.actor.items.get(itemId);

    if (!item) return;

    console.log("UPDATING AMMO:", item.name, ammoId);

    await item.update({
      "system.loadedAmmoId": ammoId
    });

  });
  html.find(".reload-weapon").click (async ev => {

  const itemId = ev.currentTarget.dataset.itemId;
  const item = this.actor.items.get(itemId);

  if (!item) return;

  const max = item.system.magazineSize || 0;

  if (max <= 0) {
    swNotify("No magazine!", "warn");
    return;
  }

    if (item.system.currentMagazine === max) {
    swNotify("Already full", "info", 1000);
    return;
  }

  await item.update({
    "system.currentMagazine": max
  });
  swNotify("Reloaded", "info", 2000);

  
  console.log("RELOAD CLICKED");

  });

  this._activateInventorySorting(html);

}

_activateInventorySorting(html) {
  let draggedItemId = null;
  const getTypeGroup = (item) => {
    if (!item) return null;
    if (item.type === "weapon") return "weapon";
    if (item.type === "armor") return "armor";
    if (item.type === "utility" && !item.system?.consumable) return "utility";
    if (item.system?.consumable) return "consumable";
    if (item.type === "ammo") return "ammo";
    return null;
  };

  html.find(".inv-item[draggable='true']").on("dragstart", (ev) => {
    const itemId = ev.currentTarget.dataset.itemId;
    if (!itemId) return;

    draggedItemId = itemId;
    ev.currentTarget.classList.add("dragging");

    if (ev.originalEvent?.dataTransfer) {
      ev.originalEvent.dataTransfer.setData("text/plain", itemId);
      ev.originalEvent.dataTransfer.effectAllowed = "move";
    }
  });

  html.find(".inv-item").on("dragover", (ev) => {
    ev.preventDefault();
    const targetEl = ev.currentTarget;
    const bounds = targetEl.getBoundingClientRect();
    const insertBefore = ev.originalEvent?.clientY < (bounds.top + bounds.height / 2);
    targetEl.classList.toggle("drop-before", Boolean(insertBefore));
    targetEl.classList.toggle("drop-after", !insertBefore);

    if (ev.originalEvent?.dataTransfer) {
      ev.originalEvent.dataTransfer.dropEffect = "move";
    }
  });

  html.find(".inv-item").on("dragleave", (ev) => {
    ev.currentTarget.classList.remove("drop-before", "drop-after");
  });

  html.find(".inv-item").on("drop", async (ev) => {
    ev.preventDefault();
    const targetEl = ev.currentTarget;
    targetEl.classList.remove("drop-before", "drop-after");

    const targetId = ev.currentTarget.dataset.itemId;
    const sourceId = draggedItemId || ev.originalEvent?.dataTransfer?.getData("text/plain");

    if (!sourceId || !targetId || sourceId === targetId) return;

    const source = this.actor.items.get(sourceId);
    const target = this.actor.items.get(targetId);
    if (!source || !target) return;
    if (getTypeGroup(source) !== getTypeGroup(target)) {
      ui.notifications.warn("Items can only be reordered inside their own type group.");
      return;
    }

    const bounds = targetEl.getBoundingClientRect();
    const insertBefore = ev.originalEvent?.clientY < (bounds.top + bounds.height / 2);
    const groupItems = [...this.actor.items.contents]
      .filter(i => getTypeGroup(i) === getTypeGroup(source))
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

    const sourceIndex = groupItems.findIndex(i => i.id === sourceId);
    const targetIndex = groupItems.findIndex(i => i.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const [moved] = groupItems.splice(sourceIndex, 1);
    const targetIndexAfterRemoval = groupItems.findIndex(i => i.id === targetId);
    const insertIndex = targetIndexAfterRemoval + (insertBefore ? 0 : 1);
    groupItems.splice(insertIndex, 0, moved);

    const sortUpdates = groupItems.map((item, index) => ({
      _id: item.id,
      sort: (index + 1) * 100000
    }));

    await this.actor.updateEmbeddedDocuments("Item", sortUpdates);
    this.render(false);
  });

  html.find(".inv-item").on("dragend", (ev) => {
    draggedItemId = null;
    ev.currentTarget.classList.remove("dragging");
  });
}

}
