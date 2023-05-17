(async () => {
  let hostile = false;
  try {
    let label = `${game.i18n.localize('TWD.ROLLFOR')}` + ' ' + actor.name;
  } catch {
    ui.notifications.error(`${game.i18n.localize('TWD.NoToken')}`);
    return;
  }
  let label = 'for ' + actor.name;
  let actorid = actor.id;
  let reRoll = false;
  let blind = false;

  let template = `
        <form>
            <label>${game.i18n.localize('TWD.ENSOKEN')}</label>

            <div class="form-group">
            <label>${game.i18n.localize('TWD.HOWMANYDICE')}</label>
            <input type="text" id="fr1Data" value=1>
            </div>
            <div class="form-group">
            <label>${game.i18n.localize('TWD.HOWMANYSTRESS')}</label>
            <input type="text" id="fr2Data" value=0>
            </div>
   
        </form>`;

  let buttons = {};
  // if (game.tables.entities.length > 0) {
  buttons = {
    draw: {
      icon: '<i class="fas fa-check"></i>',
      label: `${game.i18n.localize('TWD.Roll')}`,
      callback: async (html) => {
        // const tableId = html.find('#tableSelect')[0].value
        // const table = game.tables.get(tableId);
        const r1Data = parseInt(html.find('#fr1Data')[0].value || 0);
        const r2Data = parseInt(html.find('#fr2Data')[0].value || 0);

        await game.twd.yze.yzeRoll(hostile, blind, reRoll, label, r1Data, 'Black', r2Data, 'Stress', actorid);
      },
    },
    cancel: {
      icon: '<i class="fas fa-times"></i>',
      label: `${game.i18n.localize('TWD.DialCancel')}`,
    },
  };

  new Dialog({
    title: 'Player - Roll Alien Dice.',
    content: template,
    buttons: buttons,
    default: 'draw',
  }).render(true);
})();
