export class ShadowWorldItemDataModel extends foundry.abstract.DataModel {

  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      description: new fields.HTMLField({ initial: "" }),

      // 🔥 combat ready
      damage: new fields.StringField({ initial: "0" }),
      bonus: new fields.NumberField({ initial: 0 }),
      damageType: new fields.StringField({ initial: "lethal" }), // physical, magical, true

      // 🔥 utility
      equipped: new fields.BooleanField({ initial: false }),

      armor: new fields.NumberField({ initial: 0 }),
      dexPenalty: new fields.NumberField({ initial: 0 }),

      heal: new fields.StringField({ initial: "0" }),
      linkedSkill: new foundry.data.fields.StringField({ initial: "" }),
      penetration: new fields.NumberField({ initial: 0 }),
      consumable: new fields.BooleanField({ initial: false }),
      charges: new fields.NumberField({ initial: 0 }),
      maxCharges: new fields.NumberField({ initial: 0 }),

      effectType: new fields.StringField({ initial: "" }),
      effectValue: new fields.StringField({ initial: "" }),

      quantity: new fields.NumberField({ initial: 0}),
      damageBonus: new fields.StringField({ initial: "0"}),
      penetrationBonus: new fields.NumberField({initial: 0 }),
      loadedAmmoId: new fields.StringField({initial: "", nullable: true}),

      magazineSize: new fields.NumberField({ initial: 0 }),
      currentMagazine: new fields.NumberField({ initial: 0 }),
      effects: new fields.ArrayField(
        new fields.SchemaField({
          type: new fields.StringField({ initial: "" }),
          value: new fields.StringField({ initial: "" }),
          damageType: new fields.StringField({ initial: "" })
        }),
        { initial: [] }
      ),


    };
  }

}