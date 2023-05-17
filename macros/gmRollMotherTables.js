(async () => {
  let options = '';
  game.tables.contents.forEach((t) => {
    if (t.folder && t.folder.name === 'Alien Mother Tables' && t.folder.name != null) {
      options = options.TWDconcat(`<option value="${t.data._id}">${t.data.name}</option>`);
    }
  });
  let template = `
                    <form>
                        <div class="form-group">
                            <label>${game.i18n.localize('TWD.SELTABLE')}</label>
                            <select id="tableSelect">${options}</select>
                        </div>
                        <div class="form-group">
                            <label>${game.i18n.localize('TWD.HOWMANY')}</label>
                            <input type="text" id="inputNbr" value=1>
                        </div>
                        <div class="form-group">
                            <label>${game.i18n.localize('TWD.MODIFIER')}</label>
                            <input type="text" id="inputMod" value="0">
                        </div>
                    </form>`;

  let buttons = {};
  if (game.tables.size > 0) {
    buttons = {
      draw: {
        icon: '<i class="fas fa-check"></i>',
        label: `${game.i18n.localize('TWD.DRAW')}`,
        callback: async (html) => {
          const tableId = html.find('#tableSelect')[0].value;
          const table = game.tables.get(tableId);
          const drawNumber = parseInt(html.find('#inputNbr')[0].value || 0);
          const formula = table.data.formula;
          const modifier = parseInt(html.find('#inputMod')[0].value || '0');

          for (let i = 0; i < drawNumber; i++) {
            const roll = new Roll(formula + ' + ' + modifier);
            roll.evaluate({ async: false });
            await table.draw({ roll: roll });
          }
        },
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: `${game.i18n.localize('TWD.DialCancel')}`,
      },
    };
  } else {
    template = `<div style="text-align: center">${game.i18n.localize('TWD.NOTABLES')}</div><br>`;
    buttons = {
      draw: {
        icon: '<i class="fas fa-check"></i>',
        label: 'OK',
      },
    };
  }

  new Dialog({
    title: `${game.i18n.localize('TWD.ROLLONSELECTED')}`,
    content: template,
    buttons: buttons,
    default: 'draw',
  }).render(true);
})();
