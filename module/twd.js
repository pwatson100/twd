// Import Modules
import registerActors from './register-actors.js';
import { twdActor } from './actor/actor.js';
import { twdItem } from './item/item.js';
import { twdItemSheet } from './item/item-sheet.js';
import { yze } from './YZEDiceRoller.js';
import { TWD } from './config.js';
import registerSettings from './settings.js';
import { preloadHandlebarsTemplates } from './templates.js';
import { TwdBaseDie } from './twdRPGBaseDice.js';
import { TwdStressDie } from './twdRPGBaseDice.js';
import * as migrations from './migration.js';
import { AlienConfig } from './twdRPGConfig.js';
import TwdCombat from './combat.js';
import TwdCTContext from './CBTracker.js';
import { sendDevMessage } from './devmsg.js';
import { COMMON } from './common.js';
import { logger } from './logger.js';
import { ModuleImport, ImportFormWrapper } from './apps/init.js';

const includeRgx = new RegExp('/systems/twd/module/');
CONFIG.compatibility.includePatterns.push(includeRgx);

// CONFIG.debug.hooks = true;

const euclidianDistances = function (segments, options = {}) {
  const canvasSize = canvas.dimensions.size;
  const gridDistance = canvas.scene.data.gridDistance;

  return segments.map((s) => {
    let ray = s.ray;

    // Determine the total distance traveled
    let x = Math.abs(Math.ceil(ray.dx / canvasSize));
    let y = Math.abs(Math.ceil(ray.dy / canvasSize));

    return Math.hypot(x, y) * gridDistance;
  });
};

Hooks.on('canvasInit', function () {
  SquareGrid.prototype.measureDistances = euclidianDistances;
});

/*
  Initialize Module
*/
COMMON.build();

const SUB_MODULES = {
  COMMON,
  logger,
};

Hooks.once('init', async function () {
  console.warn(`Initializing Alien RPG`);
  game.twd = {
    twdActor,
    twdItem,
    yze,
    ModuleImport,
    ImportFormWrapper,
    rollItemMacro,
    registerSettings,
    TwdCTContext,
  };

  Object.values(SUB_MODULES).forEach((cl) => {
    logger.info(COMMON.localize('twd.Init.SubModule', { name: cl.NAME }));
    cl.register();
  });

  // Set FVTT version constant
  // const is07x = game.data.version.split('.')[1] === '7';

  // Global define for this so the roll data can be read by the reroll method.
  game.twd.rollArr = { r1Dice: 0, r1One: 0, r1Six: 0, r2Dice: 0, r2One: 0, r2Six: 0, tLabel: '', sCount: 0, multiPush: 0 };
  // console.warn('sCount init', game.twd.rollArr.sCount);

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: '1d10',
    decimals: 2,
  };

  CONFIG.Dice.terms['b'] = TwdBaseDie;
  CONFIG.Dice.terms['s'] = TwdStressDie;

  // Define custom Entity classes
  CONFIG.TWD = TWD;
  CONFIG.Actor.documentClass = twdActor;
  CONFIG.Item.documentClass = twdItem;
  CONFIG.Combat.documentClass = TwdCombat;
  CONFIG.CombatTracker = TwdCTContext;
  CombatTracker.prototype._getEntryContextOptions = TwdCTContext.getEntryContextOptions;
  CONFIG.ImportFormWrapper = ImportFormWrapper;

  // Register sheet application classes
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('twd', twdItemSheet, { types: ['item', 'weapon', 'armor', 'talent', 'skill-stunts', 'critical-injury'], makeDefault: false });
  registerSettings();
  registerActors();

  // Preload Handlebars Templates
  preloadHandlebarsTemplates();

  Handlebars.registerHelper('TWDconcat', function () {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper('toLowerCase', function (str) {
    return str.toLowerCase();
  });
  Handlebars.registerHelper('addstats', function (v1, v2) {
    return v1 + v2;
  });
  Handlebars.registerHelper('if_isWeapons', function (sectionlabel, options) {
    // console.warn('helper triggered', sectionlabel);
    if (sectionlabel === 'Weapons') {
      // console.warn('true');
      return options.fn(this);
    }
  });

  // Ifis not equal
  Handlebars.registerHelper('ifne', function (v1, v2, options) {
    if (v1 !== v2) return options.fn(this);
    else return options.inverse(this);
  });

  // if equal
  Handlebars.registerHelper('ife', function (v1, v2, options) {
    if (v1 === v2) return options.fn(this);
    else return options.inverse(this);
  });
  // if equal
  Handlebars.registerHelper('ifgt', function (v1, v2, options) {
    if (v1 > v2) return options.fn(this);
    else return options.inverse(this);
  });

  Handlebars.registerHelper('gRng', function (value, options) {
    let g = '';
    switch (value) {
      case '1':
        g = game.i18n.localize('TWD.Engaged');
        return g;
      case '2':
        g = game.i18n.localize('TWD.Short');
        return g;
      case '3':
        g = game.i18n.localize('TWD.Medium');
        return g;
      case '4':
        g = game.i18n.localize('TWD.Long');
        return g;
      case '5':
        g = game.i18n.localize('TWD.Extreme');
        return g;
    }
  });

  Handlebars.registerHelper('striptags', function (txt) {
    // console.log(txt);
    // exit now if text is undefined
    if (typeof txt == 'undefined') return;
    // the regular expresion
    var regexp = /<[\/\w]+>/g;
    // replacing the text
    return txt.replace(regexp, '');
  });


});

// Build the panic table if it does not exist.
Hooks.once('ready', async () => {

  setTimeout(() => {
    $('.notification.error').each((index, item) => {
      if ($(item).text().includes('requires a minimum screen resolution')) {
        $(item).remove();
      }
    });
  }, 250);

  let r = document.querySelector(':root');
  r.style.setProperty('--aliengreen', game.settings.get('twd', 'fontColour'));
  r.style.setProperty('--alienfont', game.settings.get('twd', 'fontStyle'));
  r.style.setProperty('black', game.settings.get('twd', 'aliendarkergreen'));
  r.style.setProperty('--alienitemselect', game.settings.get('twd', 'alienitemselect'));
  r.style.setProperty('--alienoddtab', game.settings.get('twd', 'alienoddtab'));
  r.style.setProperty('--alientextjournal', game.settings.get('twd', 'JournalFontColour'));
  if (game.settings.get('twd', 'switchJournalColour')) {
    r.style.setProperty('--journalback', `#000000`);
  }
  if (game.settings.get('twd', 'switchchatbackground')) {
    // r.style.setProperty('--chatbackground', `#000000`);
    r.style.setProperty('--chatbackground', `url('/systems/twd/images/chat-middle.png')`);

  }

  AlienConfig.toggleConfigButton(JSON.parse(game.settings.get('twd', 'addMenuButton')));

  setupMacroFolders();

});

//   // Wait to register the Hotbar drop hook on ready sothat modulescould register earlier if theywant to
Hooks.on('hotbarDrop', (bar, data, slot) => {
  let item = fromUuidSync(data.uuid);
  if (item && item.system && (item.type === 'weapon' || item.type === 'armor')) {
    createtwdrpgMacro(item, slot);
    return false;
  }
});

Hooks.on("renderPause", (_app, html, options) => {
  html.find('img[src="icons/svg/clockwork.svg"]').attr("src", "systems/twd/images/paused-twd.png");
});


// ***************************
// DsN V3 Hooks
// ***************************
Hooks.on('diceSoNiceRollComplete', (chatMessageID) => { });


Hooks.once('diceSoNiceReady', (dice3d) => {
  dice3d.addColorset({
    name: 'yellow',
    description: 'Yellow',
    category: 'Colors',
    foreground: ['#e3e300'],
    background: ['#e3e300'],
    outline: 'black',
    texture: 'none',
  });

  dice3d.addColorset(
    {
      name: 'AlienBlack',
      description: 'AlienBlack',
      category: 'Colors',
      foreground: ['#ffffff'],
      background: ['#000000'],
      outline: 'black',
      texture: 'none',
    },
    'preferred'
  );

  dice3d.addSystem({ id: 'twd', name: 'Alien RPG - Blank' }, 'preferred');
  dice3d.addDicePreset({
    type: 'db',
    labels: [
      'systems/twd/ui/DsN/alien-dice-b0.png',
      'systems/twd/ui/DsN/alien-dice-b0.png',
      'systems/twd/ui/DsN/alien-dice-b0.png',
      'systems/twd/ui/DsN/alien-dice-b0.png',
      'systems/twd/ui/DsN/alien-dice-b0.png',
      'systems/twd/ui/DsN/alien-dice-b6.png',
    ],
    colorset: 'AlienBlack',
    system: 'twd',
  });
  dice3d.addDicePreset({
    type: 'ds',
    labels: [
      'systems/twd/ui/DsN/alien-dice-y1.png',
      'systems/twd/ui/DsN/alien-dice-y0.png',
      'systems/twd/ui/DsN/alien-dice-y0.png',
      'systems/twd/ui/DsN/alien-dice-y0.png',
      'systems/twd/ui/DsN/alien-dice-y0.png',
      'systems/twd/ui/DsN/alien-dice-y6.png',
    ],
    colorset: 'yellow',
    system: 'twd',
  });

  dice3d.addSystem({ id: 'twdf', name: 'Alien RPG - Full Dice' });
  dice3d.addDicePreset({
    type: 'db',
    labels: [
      'systems/twd/ui/DsN/b1.png',
      'systems/twd/ui/DsN/b2.png',
      'systems/twd/ui/DsN/b3.png',
      'systems/twd/ui/DsN/b4.png',
      'systems/twd/ui/DsN/b5.png',
      'systems/twd/ui/DsN/alien-dice-b6.png',
    ],
    colorset: 'AlienBlack',
    system: 'twdf',
  });
  dice3d.addDicePreset({
    type: 'ds',
    labels: [
      'systems/twd/ui/DsN/alien-dice-y1.png',
      'systems/twd/ui/DsN/y2.png',
      'systems/twd/ui/DsN/y3.png',
      'systems/twd/ui/DsN/y4.png',
      'systems/twd/ui/DsN/y5.png',
      'systems/twd/ui/DsN/alien-dice-y6.png',
    ],
    colorset: 'yellow',
    system: 'twdf',
  });
});

//  Hook to watch for the Push button being pressed -   Need to refactor this so it does not fire all the time.
//

Hooks.on('renderChatMessage', (message, html, data) => {
  html.find('button.alien-Push-button').each((i, li) => {
    let hostile = '';
    li.addEventListener('click', function (ev) {
      let tarG = ev.target.previousElementSibling.checked;

      if (ev.target.classList.contains('alien-Push-button')) {
        // do stuff
        let actor = game.actors.get(message.speaker.actor);
        if (!actor) return ui.notifications.warn(game.i18n.localize('TWD.NoToken'));
        let reRoll = 'push';

        if (tarG) {
          reRoll = 'mPush';
        }

        hostile = actor.type;
        let blind = false;
        //  Initialse the chat message
        let chatMessage = '';

        if (actor.prototypeToken.disposition === -1) {
          blind = true;
        }

        switch (actor.type) {
          case 'character':
            actor.update({ 'system.header.stress.value': actor.system.header.stress.value + 1 });
            break;

          default:
            return;
        }

        const reRoll1 = game.twd.rollArr.r1Dice - game.twd.rollArr.r1Six;
        const reRoll2 = game.twd.rollArr.r2Dice + 1 - (game.twd.rollArr.r2One + game.twd.rollArr.r2Six);
        yze.yzeRoll(hostile, blind, reRoll, game.twd.rollArr.tLabel, reRoll1, game.i18n.localize('TWD.Black'), reRoll2, game.i18n.localize('TWD.Yellow'), actor.id);
      }
    });
  });
});

// // **********************************
// // If the Actor dragged on to the canvas has the NPC box checked unlink the token and change the disposition to Hostile.
// // **********************************

Hooks.on('preCreateToken', async (document, tokenData, options, userID) => {
  let aTarget = game.actors.find((i) => i.name == tokenData.name);
  if (aTarget.system.header.npc) {
    document.data.update({ disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE, actorLink: false });
  }
});

Hooks.once('setup', function () {
  const toLocalize = ['skills', 'attributes'];
  for (let o of toLocalize) {
    CONFIG.TWD[o] = Object.entries(CONFIG.TWD[o]).reduce((obj, e) => {
      obj[e[0]] = game.i18n.localize(e[1]);

      return obj;
    }, {});
  }
});

Hooks.on('dropActorSheetData', async (actor, sheet, data) => {
  // When dropping something on a vehicle sheet.
  if (actor.type === 'vehicles') {
    // When dropping an actor on a vehicle sheet.
    let crew = await fromUuid(data.uuid);
    if (data.type === 'Actor') sheet._dropCrew(crew.id);
  }
});


function setupMacroFolders() {
  if (!game.user.isGM) {
    // Only make changes to system
    return;
  }
  const folderName = "Alien RPG System Macros";
  let folder = game.folders
    .filter((f) => f.type === "Macro")
    .find((f) => f.name === folderName);
  if (!folder) {
    Folder.create({
      name: folderName,
      type: "Macro",
      parent: null,
    });
  }
}


/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createtwdrpgMacro(item, slot) {
  const folder = game.folders
    .filter((f) => f.type === "Macro")
    .find((f) => f.name === "Alien RPG System Macros");
  // Create the macro command
  const command = `game.twd.rollItemMacro("${item.name}");`;
  let macro = game.macros.find(
    (m) =>
      m.name === item.name &&
      m.command === command &&
      (m.author === game.user.id ||
        m.ownership.default >=
        CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER ||
        m.ownership[game.user.id] >=
        CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)
  );
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "twd.itemMacro": true },
      folder: folder?.id,
      "ownership.default": CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
    });
  }
  game.user.assignHotbarMacro(macro, slot);
}

function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  // console.warn('twd.js 155 - Got here', speaker, actor);
  const item = actor ? actor.items.find((i) => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(game.i18n.localize('TWD.NoItem') + ' ' + ` ${itemName}`);
  if (!item.system.header.active) return ui.notifications.warn(game.i18n.localize('TWD.NotActive') + ' ' + ` ${itemName}`);

  // Trigger the item roll
  return item.roll();
}

class Utils {
  /**
   *
   * @param cfg
   * @returns {{}}
   */
  static localize(cfg) {
    return Object.keys(cfg).reduce((i18nCfg, key) => {
      i18nCfg[key] = game.i18n.localize(cfg[key]);
      return i18nCfg;
    }, {});
  }
}
