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
    // Auto-submit on input change (optional - form submission will handle editors)
    html.find("input[type='text'], input[type='number'], textarea").change(ev => this._onSubmit(ev));
  }
}
