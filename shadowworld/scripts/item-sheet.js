export class ShadowWorldItemSheet extends ItemSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
        classes: ["shadowworld", "sheet", "item"],
        template: "systems/shadowworld/templates/item/item-sheet.hbs",
        width: 400,
        height: 300
        });
    }

  getData() {
    const context = super.getData();
    context.system = this.item.system;
    context.editable = this.isEditable;
    return context;
  }
  async _updateObject(event, formData) {
    return this.object.update(formData);
  }

  activateListeners(html) {
  super.activateListeners(html);

    // 🔥 auto-submit při změně
    html.find("input[type='text'], input[type='number'], textarea").change(ev => this._onSubmit(ev));
    html.find(".effect-add").click(async () => {

      const effects = Array.from(this.item.system.effects || []);

      effects.push({
        type: "",
        value: "",
        damageType: ""
      });

      await this.item.update({
        "system.effects": effects
      });

    });
    html.find(".effect-delete").click(async ev => {

      const index = Number(ev.currentTarget.dataset.index);

      const effects = Array.from(this.item.system.effects || []);

      effects.splice(index, 1);

      await this.item.update({
        "system.effects": effects
      });

    });
    html.find(".effect-type").change(async ev => {

      const index = Number(ev.currentTarget.dataset.index);
      const value = ev.currentTarget.value;

      const effects = Array.from(this.item.system.effects || []);

      effects[index].type = value;

      await this.item.update({
        "system.effects": effects
      });

    });
    html.find(".effect-value").change(async ev => {

      const index = Number(ev.currentTarget.dataset.index);
      const value = ev.currentTarget.value;

      const effects = Array.from(this.item.system.effects || []);

      effects[index].value = value;

      await this.item.update({
        "system.effects": effects
      });

    });
    html.find(".effect-damageType").change(async ev => {

      const index = Number(ev.currentTarget.dataset.index);
      const value = ev.currentTarget.value;

      const effects = Array.from(this.item.system.effects || []);

      effects[index].damageType = value;

      await this.item.update({
        "system.effects": effects
      });

    });
  }
}