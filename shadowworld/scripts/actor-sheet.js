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
      submitOnChange: false,
      submitOnClose: false,

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
  console.log("FORM UPDATE BLOCKED", formData);
  }

  /** @override */
  async getData() {
    const context = await super.getData();

    console.log("GET DATA:", context);

    
    const system = this.actor.system || {};

    context.system = system;
    context.items = this.actor.items.contents;
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

    // 👉 pošleme do template
    context.skillsByLevel = skillsByLevel;
    
    let items;
    try{items = this.actor.items.contents;} catch(e) {
      console.error("Error accessing items:", e);
      items = [];
    }

    console.log("RAW ITEMS:", items);

    if(!Array.isArray(items)) {
      console.warn("Items is not an array, - fixing");
      items = Array.from(items || [] );
    }

    context.items = items;

    context.quippedItems = items.filter(i => i.system?.equipped === true);
    
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
        skillLevel: 0 ,
        skillName: null});
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
        "system.skills": skills
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
      attribute: skill.attribute ?? null, // 🔥 otevře výběr
      skillLevel: skill.level ?? 1,
      skillName: skill.name
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

    await this.actor.updateEmbeddedDocuments("Item", [{
      _id: itemId,
      "system.equipped": value}
    ]);
  });
  

  // DELETE ITEM
  html.find(".item-delete").click(async ev => {
    const itemId = ev.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);

    if (!item) return;

    await item.delete();
  });
  html.find(".roll-weapon").click(async ev => {
    const itemId = ev.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);

    const roll = new Roll(item.system.damage, this.actor.getRollData());
    await roll.evaluate();

    roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
    flavor: `${item.name} - Damage`
    });
  });
}
}