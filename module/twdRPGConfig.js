export class AlienConfig extends FormApplication {
  static get getDefaults() {
    return {
      addMenuButton: true,
    };
  }
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      title: game.i18n.localize('TWD.MenuLabel'),
      id: 'alienprgSettings',
      icon: 'fas fa-cogs',
      template: 'systems/twd/module/alienprgSettings.html',
      width: 400,
      closeOnSubmit: true,
    });
  }

  getData(options) {
    return mergeObject({
      fontStyle: game.settings.get('twd', 'fontStyle'),
      fontColour: game.settings.get('twd', 'fontColour'),
      journalFontColour: game.settings.get('twd', 'JournalFontColour'),
    });
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('button[name="reset"]').click(this.onReset.bind(this));
    document.getElementById('fontStyle').value = game.settings.get('twd', 'fontStyle');

    html.find('button[name="addcrt"]').click(this.onCRT.bind(this));
  }

  async onReset() {
    // this.reset = true;
    await game.settings.set('twd', 'fontStyle', 'OCR-A');
    await game.settings.set('twd', 'fontColour', '#adff2f');
    await game.settings.set('twd', 'JournalFontColour', '#b1e0e7');
    await game.settings.set('twd', 'aliencrt', false);

    location.reload();
  }

  async onCRT() {
    await game.settings.set('twd', 'aliencrt', true);
    await game.settings.set('twd', 'fontStyle', 'Kosugi');
    await game.settings.set('twd', 'fontColour', '#88f2ad');
    location.reload();
  }

  async _updateObject(event, formData) {
    // console.log('_updateObject -> formData', formData);
    await game.settings.set('twd', 'fontColour', formData.fontColour);
    await game.settings.set('twd', 'fontStyle', formData.fontStyle);
    await game.settings.set('twd', 'JournalFontColour', formData.journalFontColour);
    ui.notifications.info(game.i18n.localize('TWD.Consumables'));
    location.reload();
  }

  close() {
    super.close();
  }

  // * Creates or removes the quick access config button
  // * @param  {Boolean} shown true to add, false to remove

  static toggleConfigButton(shown) {
    const button = $('#TwdButton');
    const menu = game.settings.menus.get('twd.twdSettings');

    if (button) button.remove();

    if (shown) {
      const title = game.i18n.localize('TWD.MenuLabel');

      $(`<button id="TwdButton" data-action="AlienConfig" title="${title}">
       <i class="fas fa-palette"></i> ${title}
     </button>`)
        .insertAfter('button[data-action="configure"]')
        .on('click', (event) => {
          if (!menu) return ui.notifications.error('No submenu found for the provided key');
          const app = new menu.type();
          // game.settings.set('twd', 'addMenuButton', true);

          return app.render(true);
        });
    }
  }
}
