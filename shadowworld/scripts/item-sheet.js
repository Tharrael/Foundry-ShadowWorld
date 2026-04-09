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
  activateListeners(html) {
  super.activateListeners(html);

    // 🔥 auto-submit při změně
    html.find("input").change(ev => this._onSubmit(ev));
  }
}