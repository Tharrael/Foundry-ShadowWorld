export class ShadowWorldItemDataModel extends foundry.abstract.DataModel {

  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      description: new fields.HTMLField({ initial: "" }),

      // 🔥 combat ready
      damage: new fields.StringField({ initial: "0" }),
      bonus: new fields.NumberField({ initial: 0 }),

      // 🔥 utility
      equipped: new fields.BooleanField({ initial: false }),

      armor: new fields.NumberField({ initial: 0 }),
      dexPenalty: new fields.NumberField({ initial: 0 }),

      heal: new fields.StringField({ initial: "0" })
    };
  }

}