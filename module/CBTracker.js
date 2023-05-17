export default class TwdCTContext extends CombatTracker {
  /**
   * Default folder context actions
   * @param html {jQuery}
   * @private
   */
  /* -------------------------------------------- */

  /**
   * Get the sidebar directory entry context options
   * @return {Object}   The sidebar entry context options
   * @private
   */
  static getEntryContextOptions() {
    return [
      {
        name: 'TWD.CombatantUpdate',
        icon: '<i class="fas fa-edit"></i>',
        callback: this._onConfigureCombatant.bind(this),
      },
      {
        name: 'TWD.CombatantReroll',
        icon: '<i class="fas fa-dice-d20"></i>',
        callback: (li) => this.viewed.rollInitiative(li.data('combatant-id')),
      },
      {
        name: 'TWD.CombatantRemove',
        icon: '<i class="fas fa-skull"></i>',
        // callback: (li) => this.viewed.deleteCombatant(li.data('combatant-id')),
        callback: (li) => this.viewed.deleteEmbeddedDocuments('Combatant', [li.data('combatant-id')]),
      },
      {
        name: 'TWD.CloneActor',
        icon: '<i class="far fa-copy fa-fw"></i>',
        callback: async (li) => {
          const combatant = this.viewed.combatants.get(li.data('combatant-id'));
          await combatant.clone({}, { save: true });
        },
      },
    ];
  }

  /* -------------------------------------------- */
}
