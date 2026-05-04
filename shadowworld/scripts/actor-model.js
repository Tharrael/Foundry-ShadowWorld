const { fields } = foundry.data;

export class ShadowWorldActorDataModel extends foundry.abstract.DataModel {

  static defineSchema() {
    return {

      attributes: new fields.SchemaField({
        str: new fields.NumberField({ initial: 0 }),
        con: new fields.NumberField({ initial: 0 }),
        dex: new fields.NumberField({ initial: 0 }),
        int: new fields.NumberField({ initial: 0 }),
        wis: new fields.NumberField({ initial: 0 }),
        cha: new fields.NumberField({ initial: 0 })
      }),

      // 🔥 DYNAMICKÉ SKILLY
      skills: new fields.ArrayField(
        new fields.SchemaField({
          name: new fields.StringField({ initial: "Skill" }),
          level: new fields.NumberField({ initial: 1 }),
          attribute: new fields.StringField({ nullable: true })
        })
      ),

      // 🔥 LIMITY OD GM
      skillLimits: new fields.SchemaField({
        1: new fields.NumberField({ initial: 0 }),
        2: new fields.NumberField({ initial: 0 }),
        3: new fields.NumberField({ initial: 0 }),
        4: new fields.NumberField({ initial: 0 }),
        5: new fields.NumberField({ initial: 0 })
      }),

      hp: new fields.SchemaField({
        max: new fields.NumberField({ initial: 0 }),
        current: new fields.NumberField({ initial: 0 }),
        nonLethal: new fields.NumberField({ initial: 0 })
      }),

      armor: new fields.SchemaField({
        level: new fields.NumberField({ initial: 0 })
      }),

      journal: new foundry.data.fields.HTMLField({ initial: "" }),

      trait: new fields.StringField({ initial: "human" })

    };
  }
}