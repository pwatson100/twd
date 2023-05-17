import { yze } from '../YZEDiceRoller.js';
import { addSign } from '../utils.js';
import { TWD } from '../config.js';
import { logger } from '../logger.js';

/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */

export class twdActor extends Actor {
  /** @override */
  getRollData() {
    const rData = super.getRollData();
    const shorthand = game.settings.get('twd', 'macroShorthand');

    // Re-map all attributes onto the base roll data
    if (!!shorthand) {
      for (let [k, v] of Object.entries(rData.attributes)) {
        if (!(k in rData)) rData[k] = v.value;
      }
    }
    if (!!shorthand) {
      for (let [k, v] of Object.entries(rData.header)) {
        if (!(k in rData)) rData[k] = v.value;
      }
    }
    if (!!shorthand) {
      for (let [k, v] of Object.entries(rData.general)) {
        if (!(k in rData)) rData[k] = v.value;
      }
    }
    if (this.type === 'character' || this.type === 'synthetic') {
      if (!!shorthand) {
        for (let [k, v] of Object.entries(rData.skills)) {
          if (!(k in rData)) rData[k] = v.value;
        }
      }
    }

    // Map all items data using their slugified names
    rData.items = this.items.reduce((obj, i) => {
      let key = i.name.slugify({ strict: true });
      let itemData = duplicate(i.system);
      if (itemData.skill) {
        return;
      }
      if (!!shorthand && !!itemData.skill) {
        for (let [k, v] of Object.entries(itemData.attributes)) {
          if (!(k in itemData)) itemData[k] = v.value;
        }
        // delete itemData['attributes'];
      }
      obj[key] = itemData;
      return obj;
    }, {});

    return rData;
  }

  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    const actorData = this._source;
    // console.log('🚀 ~ file: actor.js ~ line 69 ~ twdActor ~ prepareBaseData ~ actorData', actorData);
    const data = actorData.system;
    const flags = this.flags;
    switch (this.type) {
      case 'character':
      case 'synthetic':
        this._prepareCharacterData(actorData, flags);
        // debugger;
        break;
      case 'vehicles':
      case 'spacecraft':
        this._prepareVehicleData(actorData, flags);
        break;
      case 'creature':
        this._prepareCreatureData(actorData, flags);
        break;
      case 'territory':
        this._prepareTeritoryData(actorData, flags);
        break;

      default:
        break;
    }
  }

  /**
   * Prepare Character type specific data
   */

  async _prepareCharacterData(actorData) {
    super.prepareDerivedData();
  }

  _prepareVehicleData(data) { }
  _prepareCreatureData(actorData) { }
  _prepareTeritoryData(data) {
    this.img = 'systems/twd/images/icons/nested-eclipses.svg';
  }

  _prepareTokenImg() {
    if (game.settings.get('twd', 'defaultTokenSettings')) {
      if (this.token.img == 'icons/svg/mystery-man.svg' && this.token.img != this.img) {
        this.token.img = this.img;
      }
    }
  }

  // *************************************************
  // Setupthe prototype token
  // *************************************************
  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);
    let tokenProto = {
      'prototypeToken.displayName': CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
      'prototypeToken.displayBars': CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
      'prototypeToken.disposition': CONST.TOKEN_DISPOSITIONS.FRIENDLY,
      'prototypeToken.name': `${data.name}`,
      'prototypeToken.bar1': { attribute: 'header.health' },
      'prototypeToken.bar2': { attribute: 'None' },
      // 'prototypeToken.vision': true,
      'prototypeToken.actorLink': true,
      'prototypeToken.sight.enabled': 'true',
      'prototypeToken.sight.range': '12',
    };
    if (game.settings.get('twd', 'defaultTokenSettings')) {
      switch (data.type) {
        case 'character':
          tokenProto['prototypeToken.bar2'] = { attribute: 'header.stress' };
          break;
        case 'vehicles':
          tokenProto['prototypeToken.bar1'] = { attribute: 'None' };
          break;
        case 'creature':
          tokenProto['prototypeToken.actorLink'] = false;
          tokenProto['prototypeToken.disposition'] = CONST.TOKEN_DISPOSITIONS.HOSTILE;
          tokenProto['prototypeToken.sight.enabled'] = false;
          break;
        case 'synthetic':
          break;
        case 'territory':
          tokenProto['prototypeToken.bar1'] = { attribute: 'None' };
          tokenProto['prototypeToken.img'] = 'systems/twd/images/icons/nested-eclipses.svg';
          tokenProto['prototypeToken.sight.enabled'] = false;
          break;
      }
    }
    this.updateSource(tokenProto);
  }

  async _checkOverwatch(actorData) {
    let conDition = await this.hasCondition('overwatch');
    // if (await this.hasCondition('overwatch')) {
    if (conDition != undefined || conDition) {
      // await this.updateSource({ 'system.general.overwatch': true });
      setProperty(actorData.actor, 'system.general.overwatch', true);
    } else {
      // await this.updateSource({ 'system.general.overwatch': false });
      setProperty(actorData.actor, 'system.general.overwatch', false);
    }
  }

  async rollAbility(actor, dataset) {
    let label = dataset.label;
    let r2Data = 0;
    let reRoll = false;
    let actorId = actor.id;
    let effectiveActorType = actor.type;
    game.twd.rollArr.sCount = 0;
    game.twd.rollArr.multiPush = 0;

    let modifier = parseInt(dataset?.mod ?? 0) + parseInt(dataset?.modifier ?? 0);
    let stressMod = parseInt(dataset?.stressMod ?? 0);

    // the dataset value is returned to the DOM so it should be set to 0 in case a future roll is made without the
    // modifier dialog.

    dataset.modifier = 0;
    dataset.stressMod = 0;

    // console.log('🚀 ~ file: actor.js ~ line 397 ~ twdActor ~ rollAbility ~ dataset.roll', dataset.roll);
    if (dataset.roll) {
      let r1Data = parseInt(dataset.roll || 0) + parseInt(modifier);
      if (dataset.attr) {
        r1Data = parseInt(modifier);
      }
      // console.log('🚀 ~ file: actor.js ~ line 395 ~ twdActor ~ rollAbility ~ r1Data', r1Data);

      reRoll = true;
      r2Data = 0;

      switch (actor.type) {
        case 'character':
          reRoll = false;
          r2Data = actor.getRollData().stress + parseInt(stressMod);
          break;
        case 'synthetic':
          if (actor.system.header.synthstress) {
            effectiveActorType = 'character'; // make rolls look human
            r2Data = parseInt(stressMod);
            reRoll = false;
          }
          break;
        case 'vehicles':
          if (dataset.spbutt != 'armor') {
            reRoll = false;
            actorId = dataset.actorid;
            let pilotData = game.actors.get(dataset.actorid);
            r2Data = pilotData.getRollData().stress + parseInt(stressMod) || 0;
          }
          break;

        default:
          break;
      }

      let blind = false;
      if (dataset.spbutt === 'armor' && r1Data < 1 && !dataset.armorP && !dataset.armorDou) {
        return;
      } else if (dataset.spbutt === 'armor') {
        label = game.i18n.localize('TWD.Armor');
        // label = 'Armor';
        r2Data = 0;
        reRoll = true;
        if (dataset.armorP === 'true') {
          r1Data = parseInt(Math.ceil(r1Data / 2)); // fix to armor so it rounds up instead of down
          dataset.armorP = 'false';
        }
        if (dataset.armorDou === 'true') {
          r1Data = parseInt(r1Data * 2);
          dataset.armorDou = 'false';
        }
      }

      if (label === game.i18n.localize('TWD.Radiation')) {
        r2Data = 0;
        reRoll = true;
        r1Data += 1;
      }
      // if (actor.data.token.disposition === -1) {
      //   blind = true;
      // }

      // TODO
      //
      // Need to put some code here to pop a message if r1Data and r2Data are zero.  Otherwise it just throws and error.
      //
      // TODO

      yze.yzeRoll(effectiveActorType, blind, reRoll, label, r1Data, game.i18n.localize('TWD.Black'), r2Data, game.i18n.localize('TWD.Yellow'), actorId);
      game.twd.rollArr.sCount = game.twd.rollArr.r1Six + game.twd.rollArr.r2Six;
    } else {
      if (dataset.panicroll) {
        // Roll against the panic table and push the roll to the chat log.
        let chatMessage = '';
        const table = game.tables.getName('Panic Table');
        // let aStress = actor.getRollData().stress;
        if (!table) {
          return ui.notifications.error(game.i18n.localize('TWD.NoPanicTable'));
        }

        let rollModifier = parseInt(modifier) + parseInt(stressMod);
        // console.log('🚀 ~ file: actor.js ~ line 432 ~ twdActor ~ rollAbility ~ rollModifier', rollModifier);

        let aStress = 0;

        if (actor.type === 'synthetic') {
          if (!actor.system.header.synthstress) return;

          actor.system.header.stress = new Object({ mod: '0' });
          actor.system.general.panic = new Object({ lastRoll: '0', value: '0' });
          aStress = 0;
        } else aStress = actor.getRollData().stress + rollModifier;

        let modRoll = '1d6' + '+' + parseInt(aStress);
        console.warn('rolling stress', modRoll);
        const roll = new Roll(modRoll);
        roll.evaluate({ async: false });
        const customResults = await table.roll({ roll });
        let oldPanic = actor.system.general.panic.lastRoll;

        if (customResults.roll.total >= 7 && actor.system.general.panic.value === 0) {
          this.causePanic(actor);
        }

        chatMessage +=
          '<h2 class="alienchatred ctooltip">' +
          game.i18n.localize('TWD.PanicCondition') +
          ' ' +
          addSign(aStress).toString() +
          '<span class="ctooltiptext">' +
          game.i18n.localize('TWD.Stress') +
          ' + (' +
          (actor.getRollData().stress || 0) +
          ') <br>+ ' +
          game.i18n.localize('TWD.StressMod') +
          ' + (' +
          stressMod +
          ') <br>+ ' +
          game.i18n.localize('TWD.Talent-Crit') +
          ' + (' +
          modifier +
          ')' +
          '</span></h2>';

        let mPanic = customResults.roll.total < actor.system.general.panic.lastRoll;

        let pCheck = oldPanic + 1;
        if (actor.system.general.panic.value && mPanic) {
          actor.update({ 'system.general.panic.lastRoll': pCheck });

          chatMessage +=
            '<h4 style="font-weight: bolder"><i><b>' +
            game.i18n.localize('TWD.Roll') +
            ' ' +
            `${customResults.roll.total}` +
            ' ' +
            '<span class="alienchatred"><i><b>' +
            game.i18n.localize('TWD.MorePanic') +
            '</span></b></i></span></h4>';

          chatMessage +=
            '<h4><i>' +
            game.i18n.localize('TWD.PCPanicLevel') +
            '<b class="alienchatred">' +
            game.i18n.localize('TWD.Level') +
            ' ' +
            `${pCheck}` +
            ' ' +
            game.i18n.localize('TWD.Seepage104') +
            '</b></i></h4>';

          chatMessage += this.morePanic(pCheck);
        } else {
          if (actor.type === 'character') actor.update({ 'system.general.panic.lastRoll': customResults.roll.total });
          pCheck = customResults.roll.total;
          chatMessage += '<h4><i><b>' + game.i18n.localize('TWD.Roll') + ' ' + `${pCheck}` + ' </b></i></h4>';
          // chatMessage += game.i18n.localize(`TWD.${customResults.results[0].text}`);
          chatMessage += this.morePanic(pCheck);
          if (customResults.roll.total >= 7) {
            chatMessage += `<h4 class="alienchatred"><i><b>` + game.i18n.localize('TWD.YouAreAtPanic') + ` <b>` + game.i18n.localize('TWD.Level') + ` ${pCheck}</b></i></h4>`;
          }
        }
        let trauma = customResults.roll.total >= 13 || pCheck >= 13;
        if (trauma) {
          chatMessage += `<h4><b>` + game.i18n.localize('TWD.PermanantTrauma') + `<i>(` + game.i18n.localize('TWD.Seepage106') + `) </i></h4></b>`;
        }

        let rollMode = game.settings.get('core', 'rollMode');
        let whispertarget = [];

        if (rollMode == 'gmroll' || rollMode == 'blindroll') {
          whispertarget = game.users.contents.filter((u) => u.isGM).map((u) => u._id);
        } else if (rollMode == 'selfroll') {
          whispertarget = game.users.contents.filter((u) => u.isGM).map((u) => u._id);
          whispertarget.push(game.user._id);
        }

        let blind = false;
        if (rollMode == 'blindroll') {
          blind = true;
          if (!game.user.isGM) {
            function SelfMessage(content, sound) {
              let selftarget = [];
              selftarget.push(game.user._id);

              ChatMessage.create({ speaker: { actor: actorId }, content, whisper: selftarget, type: CONST.CHAT_MESSAGE_TYPES.OTHER, sound, blind: false });
            }

            SelfMessage('<h2 class="alienchatred">' + game.i18n.localize('TWD.PanicCondition') + addSign(aStress).toString() + ' ???</h2>', CONFIG.sounds.dice);
          }
        }

        ChatMessage.create({
          speaker: {
            actor: actorId,
          },

          content: chatMessage,
          whisper: whispertarget,
          roll: customResults.roll,
          type: CONST.CHAT_MESSAGE_TYPES.ROLL,
          sound: CONFIG.sounds.dice,
          blind,
        });
      }
    }
  }

  async rollAbilityMod(actor, dataset) {
    function myRenderTemplate(template) {
      let confirmed = false;
      let armorP = false;
      let armorDou = false;
      switch (dataset.spbutt) {
        case 'armorVfire':
          renderTemplate(template).then((dlg) => {
            new Dialog({
              title: game.i18n.localize('TWD.DialTitle1') + ' ' + dataset.label + ' ' + game.i18n.localize('TWD.DialTitle2'),
              content: dlg,
              buttons: {
                one: {
                  icon: '<i class="fas fa-check"></i>',
                  label: game.i18n.localize('TWD.DialRoll'),
                  callback: () => (confirmed = true),
                },
                four: {
                  icon: '<i class="fas fa-times"></i>',
                  label: game.i18n.localize('TWD.DialCancel'),
                  callback: () => (confirmed = false),
                },
              },
              default: 'one',
              close: (html) => {
                if (confirmed || armorP || armorDou) {
                  let modifier = parseInt(html.find('[name=modifier]')[0]?.value);
                  let stressMod = html.find('[name=stressMod]')[0]?.value;

                  if (stressMod == 'undefined') {
                    stressMod = 0;
                  } else stressMod = parseInt(stressMod);
                  if (modifier == 'undefined') {
                    modifier = 0;
                  } else modifier = parseInt(modifier);
                  if (isNaN(modifier)) modifier = 0;
                  if (isNaN(stressMod)) stressMod = 0;
                  // console.log('🚀 ~ file: actor.js ~ line 575 ~ twdActor ~ renderTemplate ~ stressMod', stressMod);

                  dataset.modifier = modifier;
                  dataset.stressMod = stressMod;
                  actor.rollAbility(actor, dataset);
                }
              },
            }).render(true);
          });

          break;
        case 'armor':
          renderTemplate(template).then((dlg) => {
            new Dialog({
              title: game.i18n.localize('TWD.DialTitle1') + ' ' + dataset.label + ' ' + game.i18n.localize('TWD.DialTitle2'),
              content: dlg,
              buttons: {
                one: {
                  icon: '<i class="fas fa-check"></i>',
                  label: game.i18n.localize('TWD.DialRoll'),
                  callback: () => (confirmed = true),
                },
                two: {
                  label: game.i18n.localize('TWD.ArmorPiercing'),
                  callback: () => (armorP = true),
                },
                three: {
                  label: game.i18n.localize('TWD.ArmorDoubled'),
                  callback: () => (armorDou = true),
                },
                four: {
                  icon: '<i class="fas fa-times"></i>',
                  label: game.i18n.localize('TWD.DialCancel'),
                  callback: () => (confirmed = false),
                },
              },
              default: 'one',
              close: (html) => {
                if (confirmed || armorP || armorDou) {
                  let modifier = parseInt(html.find('[name=modifier]')[0]?.value);
                  let stressMod = html.find('[name=stressMod]')[0]?.value;

                  if (stressMod == 'undefined') {
                    stressMod = 0;
                  } else stressMod = parseInt(stressMod);
                  if (modifier == 'undefined') {
                    modifier = 0;
                  } else modifier = parseInt(modifier);
                  if (isNaN(modifier)) modifier = 0;
                  if (isNaN(stressMod)) stressMod = 0;
                  // console.log('🚀 ~ file: actor.js ~ line 575 ~ twdActor ~ renderTemplate ~ stressMod', stressMod);

                  dataset.modifier = modifier;
                  dataset.stressMod = stressMod;
                  dataset.armorP = armorP;
                  dataset.armorDou = armorDou;
                  actor.rollAbility(actor, dataset);
                }
              },
            }).render(true);
          });

          break;

        default:
          renderTemplate(template).then((dlg) => {
            new Dialog({
              title: game.i18n.localize('TWD.DialTitle1') + ' ' + dataset.label + ' ' + game.i18n.localize('TWD.DialTitle2'),
              content: dlg,
              buttons: {
                one: {
                  icon: '<i class="fas fa-check"></i>',
                  label: game.i18n.localize('TWD.DialRoll'),
                  callback: () => (confirmed = true),
                },
                four: {
                  icon: '<i class="fas fa-times"></i>',
                  label: game.i18n.localize('TWD.DialCancel'),
                  callback: () => (confirmed = false),
                },
              },
              default: 'one',
              close: (html) => {
                if (confirmed) {
                  let modifier = parseInt(html.find('[name=modifier]')[0]?.value);
                  let stressMod = html.find('[name=stressMod]')[0]?.value;

                  if (stressMod == 'undefined') {
                    stressMod = 0;
                  } else stressMod = parseInt(stressMod);
                  if (modifier == 'undefined') {
                    modifier = 0;
                  } else modifier = parseInt(modifier);
                  if (isNaN(modifier)) modifier = 0;
                  if (isNaN(stressMod)) stressMod = 0;
                  // console.log('🚀 ~ file: actor.js ~ line 575 ~ twdActor ~ renderTemplate ~ stressMod', stressMod);

                  dataset.modifier = modifier;
                  dataset.stressMod = stressMod;
                  actor.rollAbility(actor, dataset);
                }
              },
            }).render(true);
          });

          break;
      }
    }

    if (dataset.roll) {
      // call pop up box here to get any mods then use standard RollAbility()
      // Check that is a character (and not armor) or a synth pretending to be a character.
      if (((actor.type === 'character' || actor.type === 'vehicles') && dataset.spbutt != 'armor') || actor.system.header.synthstress) {
        myRenderTemplate('systems/twd/templates/dialog/roll-all-dialog.html');
      } else if (actor.type === 'synthetic') {
        myRenderTemplate('systems/twd/templates/dialog/roll-base-dialog.html');
      } else {
        myRenderTemplate('systems/twd/templates/dialog/roll-base-dialog.html');
      }
    } else if (dataset.panicroll) {
      // Roll against the panic table and push the roll to the chat log.

      myRenderTemplate('systems/twd/templates/dialog/roll-stress-dialog.html');
    }
  }

  async nowRollItem(item, event) {
    // if (item.type === 'weapon' || item.type === 'armor') {
    if (item.type === 'weapon') {
      // Trigger the item roll
      return item.roll(false);
    }
  }

  async rollItemMod(item, event) {
    if (item.type === 'weapon') {
      // Trigger the item roll
      return item.roll(true);
    }
  }

  async stressChange(actor, dataset) {
    switch (dataset.pmbut) {
      case 'minusStress':
        if (actor.system.header.stress.value <= 0) {
          actor.update({ 'system.header.stress.value': (actor.system.header.stress.value = 0) });
        } else {
          actor.update({ 'system.header.stress.value': actor.system.header.stress.value - 1 });
        }
        break;
      case 'plusStress':
        actor.update({ 'system.header.stress.value': actor.system.header.stress.value + 1 });
        break;
      case 'minusHealth':
        if (actor.system.header.health.value <= 0) {
          actor.update({ 'system.header.health.value': (actor.system.header.health.value = 0) });
        } else {
          actor.update({ 'system.header.health.value': actor.system.header.health.value - 1 });
        }
        break;
      case 'plusHealth':
        actor.update({ 'system.header.health.value': actor.system.header.health.value + 1 });
        break;

      default:
        break;
    }
  }

  async checkAndEndPanic(actor) {
    if (actor.type != 'character') return;

    if (actor.system.general.panic.lastRoll > 0) {
      actor.update({ 'system.general.panic.lastRoll': 0 });
      actor.removeCondition('panicked');
      ChatMessage.create({ speaker: { actor: actor.id }, content: 'Panic is over', type: CONST.CHAT_MESSAGE_TYPES.OTHER });
    }
  }

  async causePanic(actor) {
    actor.update({ 'system.general.panic.value': actor.system.general.panic.value + 1 });
    actor.addCondition('panicked');
  }

  async addCondition(effect) {
    if (typeof effect === 'string') effect = duplicate(TWD.conditionEffects.find((e) => e.id == effect));
    if (!effect) return 'No Effect Found';

    if (!effect.id) return 'Conditions require an id field';

    let existing = await this.hasCondition(effect.id);

    if (!existing) {
      effect.label = game.i18n.localize(effect.label);
      effect['flags.core.statuses'] = effect.id;
      effect['statuses'] = effect.id;
      delete effect.id;
      return this.createEmbeddedDocuments('ActiveEffect', [effect]);
    }
  }

  async removeCondition(effect) {
    if (typeof effect === 'string') effect = duplicate(TWD.conditionEffects.find((e) => e.id == effect));
    if (!effect) return 'No Effect Found';

    if (!effect.id) return 'Conditions require an id field';

    let existing = await this.hasCondition(effect.id);

    if (existing) {
      return existing.delete();
    }
  }

  async hasCondition(conditionKey) {
    let existing = this.effects.find((i) => i.getFlag('core', 'statuses') == conditionKey);
    return existing;
  }

  async checkMarks(actor, event) {
    const field = $(event.currentTarget).siblings('input[type="hidden"]');
    const max = field.data('max') == undefined ? 4 : field.data('max');
    const statIsItemType = field.data('stat-type') == undefined ? false : field.data('stat-type'); // Get the current level and the array of levels
    const level = parseFloat(field.val());
    let newLevel = ''; // Toggle next level - forward on click, backwards on right

    if (event.type === 'click') {
      newLevel = Math.clamped(level + 1, 0, max);
    } else if (event.type === 'contextmenu') {
      newLevel = Math.clamped(level - 1, 0, max);
      if (field[0].name === 'system.general.panic.value') {
        actor.checkAndEndPanic(actor);
      }
    } // Update the field value and save the form
    field.val(newLevel);
    return event;
  }

  async conCheckMarks(actor, event) {
    const field = $(event.currentTarget).siblings('input[type="hidden"]');
    const max = field.data('max') == undefined ? 4 : field.data('max');
    const statIsItemType = field.data('stat-type') == undefined ? false : field.data('stat-type'); // Get the current level and the array of levels
    const level = parseFloat(field.val());
    let newLevel = ''; // Toggle next level - forward on click, backwards on right
    let aTokens = '';

    if (event.type === 'click') {
      newLevel = Math.clamped(level + 1, 0, max);

      switch (field[0].name) {
        case 'system.general.starving.value':
          actor.addCondition('starving');
          break;

        case 'system.general.dehydrated.value':
          actor.addCondition('dehydrated');
          break;

        case 'system.general.exhausted.value':
          actor.addCondition('exhausted');
          break;

        case 'system.general.freezing.value':
          actor.addCondition('freezing');
          break;

        case 'system.general.radiation.value':
          actor.addCondition('radiation');
          actor.rollAbility(actor, event.currentTarget.dataset);

          break;

        default:
          break;
      }
    } else if (event.type === 'contextmenu') {
      newLevel = Math.clamped(level - 1, 0, max);
      // if (field[0].name === 'system.general.panic.value') {
      //   actor.checkAndEndPanic(actor);
      // }
      switch (field[0].name) {
        case 'system.general.starving.value':
          actor.removeCondition('starving');
          break;

        case 'system.general.dehydrated.value':
          actor.removeCondition('dehydrated');
          break;

        case 'system.general.exhausted.value':
          actor.removeCondition('exhausted');
          break;

        case 'system.general.freezing.value':
          actor.removeCondition('freezing');
          break;

        case 'system.general.radiation.value':
          if (actor.system.general.radiation.value <= 1) {
            actor.removeCondition('radiation');
          }
          break;

        default:
          break;
      }
    } // Update the field value and save the form
    field.val(newLevel);
    return event;
  }

  async consumablesCheck(actor, consUme, label, tItem) {
    let r1Data = 0;
    let r2Data = 0;
    r2Data = actor._source.system.consumables[`${consUme}`].value;
    let reRoll = true;
    // let hostile = this.actor.system.type;
    let blind = false;
    if (actor.token?.disposition === -1) {
      blind = true;
    }
    if (r2Data <= 0) {
      return ui.notifications.warn(game.i18n.localize('TWD.NoSupplys'));
    } else {
      yze.yzeRoll('supply', blind, reRoll, label, r1Data, game.i18n.localize('TWD.Black'), r2Data, game.i18n.localize('TWD.Yellow'), actor.id);
      // debugger;
      if (game.twd.rollArr.r2One) {
        getItems(actor, consUme, tItem);
      }
    }

    async function getItems(aActor, aconsUme, atItem) {
      let bRoll = game.twd.rollArr.r2One;
      let tNum = 0;
      let pValue = '';
      let pItem = '';
      let iConsUme = '';
      let field = `system.attributes.${aconsUme}.value`;
      let aField = `system.consumables.${aconsUme}.value`;

      if (aconsUme === 'power') {
        pItem = aActor.items.get(atItem);

        pValue = pItem.system.attributes.power.value ?? 0;
        field = `system.attributes.power.value`;
        if (pValue - game.twd.rollArr.r2One <= '0') {
          await pItem.update({ [field]: '0' });
          await aActor.update({ 'system.consumables.power.value': aActor.system.consumables.power.value - pValue });
        } else {
          await pItem.update({ [field]: pValue - game.twd.rollArr.r2One });
          await aActor.update({ 'system.consumables.power.value': aActor.system.consumables.power.value - game.twd.rollArr.r2One });
        }
      } else {
        if (aconsUme === 'air') {
          iConsUme = 'airsupply';
          field = `system.attributes.${iConsUme}.value`;
        } else {
          iConsUme = aconsUme;
        }
        // while (bRoll > 0) {
        for (const key in aActor.items.contents) {
          if (bRoll <= 0) {
            break;
          }

          if (aActor.items.contents[key].type === 'item' && aActor.items.contents[key].system.header.active) {
            if (Object.hasOwnProperty.call(aActor.items.contents, key) && bRoll > 0) {
              let element = aActor.items.contents[key];
              if (element.system.attributes[iConsUme].value) {
                let mitem = aActor.items.get(element.id);
                let iVal = element.system.attributes[iConsUme].value;
                if (iVal - bRoll < 0) {
                  tNum = iVal;
                  // bRoll -= iVal;
                } else {
                  tNum = bRoll;
                }
                await mitem.update({ [field]: element.system.attributes[iConsUme].value - tNum });
              }
            }
            bRoll -= tNum;
          }

          if (aActor.items.contents[key].type === 'armor' && aconsUme === 'air' && aActor.items.contents[key].system.header.active) {
            if (Object.hasOwnProperty.call(aActor.items.contents, key) && bRoll > 0) {
              let element = aActor.items.contents[key];
              if (element.system.attributes[iConsUme].value) {
                let mitem = aActor.items.get(element.id);
                let iVal = element.system.attributes[iConsUme].value;
                if (iVal - bRoll < 0) {
                  tNum = iVal;
                  // bRoll -= iVal;
                } else {
                  tNum = bRoll;
                }
                await mitem.update({ [field]: element.system.attributes[iConsUme].value - tNum });
              }
            }
            bRoll -= tNum;
          }
        }
        await aActor.update({ [aField]: `system.consumables.${aconsUme}.value` - tNum });
      }
    }
  }

  async creatureAcidRoll(actor, dataset) {
    let template = 'systems/twd/templates/dialog/roll-base-xeno-dialog.html';
    let label = dataset.label;
    let r1Data = parseInt(dataset.roll || 0);
    let r2Data = 0;
    let reRoll = true;
    let hostile = 'creature';
    let blind = false;
    if (dataset.roll != '-') {
      if (dataset.spbutt === 'armor' && r1Data < 1) {
        return;
      } else if (dataset.spbutt === 'armor') {
        // label = 'Armor';
        label = game.i18n.localize('TWD.Armor');
        r2Data = 0;
      }
      if (!actor.token) {
        ui.notifications.notify(game.i18n.localize('TWD.NoToken'));
        return;
      } else {
        if (actor.prototypeToken.disposition === -1) {
          // hostile = true;
          blind = true;
        }
      }

      // callpop upbox here to get any mods then update r1Data or rData as appropriate.
      let confirmed = false;
      renderTemplate(template).then((dlg) => {
        new Dialog({
          title: game.i18n.localize('TWD.DialTitle1') + ' ' + label + ' ' + game.i18n.localize('TWD.DialTitle2'),
          content: dlg,
          buttons: {
            one: {
              icon: '<i class="fas fa-check"></i>',
              label: game.i18n.localize('TWD.DialRoll'),
              callback: () => (confirmed = true),
            },
            two: {
              icon: '<i class="fas fa-times"></i>',
              label: game.i18n.localize('TWD.DialCancel'),
              callback: () => (confirmed = false),
            },
          },
          default: 'one',
          close: (html) => {
            if (confirmed) {
              let modifier = parseInt(html.find('[name=damage]')[0].value);
              r1Data = r1Data + modifier;
              yze.yzeRoll(hostile, false, reRoll, label, r1Data, 'Black', r2Data, 'Stress', actor.id);
            }
          },
        }).render(true);
      });
    } else {
      // Roll against the panic table and push the roll to the chat log.
      let chatMessage = '';
      chatMessage += '<h2>' + game.i18n.localize('TWD.AcidAttack') + '</h2>';
      chatMessage += `<h4><i>` + game.i18n.localize('TWD.AcidBlood') + `</i></h4>`;
      ChatMessage.create({
        user: game.user._id,
        speaker: {
          actor: actor.id,
        },
        content: chatMessage,
        whisper: game.users.contents.filter((u) => u.isGM).map((u) => u._id),
        blind: true,
      });
    }
  }

  async creatureAttackRoll(actor, dataset, manCrit) {
    let chatMessage = '';
    let customResults = '';
    const targetTable = dataset.atttype;
    if (targetTable === 'None') {
      logger.warn(game.i18n.localize('TWD.NoCharCrit'));
      return;
    }
    const table = game.tables.contents.find((b) => b.name === targetTable);
    const roll = new Roll('1d6');

    if (!manCrit) {
      roll.evaluate({ async: false });
      customResults = await table.roll({ roll });
    } else {
      const formula = manCrit;
      const roll = new Roll(formula);
      roll.evaluate({ async: false });
      customResults = await table.roll({ roll });
    }

    // roll.evaluate({ async: false });

    // const customResults = await table.roll({ roll });

    chatMessage += '<h2>' + game.i18n.localize('TWD.AttackRoll') + '</h2>';
    chatMessage += `<h4><i>${table.name}</i></h4>`;
    chatMessage += `${customResults.results[0].text}`;
    ChatMessage.create({
      user: game.user._id,
      speaker: {
        actor: actor.id,
      },
      roll: customResults.roll,
      content: chatMessage,
      // whisper: game.users.contents.filter((u) => u.isGM).map((u) => u._id),
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    });
  }

  async creatureManAttackRoll(actor, dataset) {
    function myRenderTemplate(template) {
      let confirmed = false;
      renderTemplate(template).then((dlg) => {
        new Dialog({
          title: game.i18n.localize('TWD.rollManCreatureAttack'),
          content: dlg,
          buttons: {
            one: {
              icon: '<i class="fas fa-check"></i>',
              label: game.i18n.localize('TWD.DialRoll'),
              callback: () => (confirmed = true),
            },
            four: {
              icon: '<i class="fas fa-times"></i>',
              label: game.i18n.localize('TWD.DialCancel'),
              callback: () => (confirmed = false),
            },
          },
          default: 'one',
          close: (html) => {
            if (confirmed) {
              let manCrit = html.find('[name=manCrit]')[0]?.value;

              if (manCrit == 'undefined') {
                manCrit = '1';
              }
              if (!manCrit.match(/^[1-6]$/gm)) {
                ui.notifications.warn(game.i18n.localize('TWD.rollManCreAttMax'));
                return;
              }
              actor.creatureAttackRoll(actor, dataset, manCrit);
            }
          },
        }).render(true);
      });
    }
    myRenderTemplate('systems/twd/templates/dialog/roll-manual-creature-attack-dialog.html');
  }

  morePanic(pCheck) {
    let con = '';
    switch (pCheck) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
        con = game.i18n.localize('TWD.Panic1');
        break;
      case 7:
        con = game.i18n.localize('TWD.Panic7');
        break;
      case 8:
        con = game.i18n.localize('TWD.Panic8');
        break;
      case 9:
        con = game.i18n.localize('TWD.Panic9');
        break;
      case 10:
        con = game.i18n.localize('TWD.Panic10');
        break;
      case 11:
        con = game.i18n.localize('TWD.Panic11');
        break;
      case 12:
        con = game.i18n.localize('TWD.Panic12');
        break;
      case 13:
        con = game.i18n.localize('TWD.Panic13');
        break;
      case 14:
        con = game.i18n.localize('TWD.Panic14');
        break;
      default:
        con = game.i18n.localize('TWD.Panic15');
        break;
    }
    return con;
  }

  async rollCrit(actor, type, dataset, manCrit) {
    let atable = '';
    let healTime = 0;
    let cFatal = false;
    let factorFour = '';
    let testArray = '';
    let rollheal = '';
    let newHealTime = '';
    let htmlData = '';
    let resultImage = '';
    let critTable = false;
    let test1 = '';
    let hFatal = '';
    let hHealTime = '';
    let hTimeLimit = '';

    switch (type) {
      case 'character':
        atable = game.tables.getName('Critical injuries');
        if (atable === null || atable === undefined) {
          ui.notifications.warn(game.i18n.localize('TWD.NoCharCrit'));
          return;
        }
        break;

      default:
        return;
    }
    if (!manCrit) {
      test1 = await atable.draw({ displayChat: false });
    } else {
      const formula = manCrit;
      const roll = new Roll(formula);
      roll.evaluate({ async: false });
      test1 = await atable.draw({ roll: roll, displayChat: false });
    }


    const messG = test1.results[0].text;
    switch (type) {
      case 'character':
        {
          resultImage = test1.results[0].img;
          factorFour = messG.replace(/(<b>)|(<\/b>)/gi, '');
          testArray = factorFour.split(/[:] |<br \/>/gi);
          let speanex = testArray[7];
          if (testArray[9] != 'Permanent') {
            if (testArray[9].length > 0) {
              rollheal = testArray[9].match(/^\[\[([0-9]d[0-9]+)]/)[1];
              newHealTime = testArray[9].match(/^\[\[([0-9]d[0-9]+)\]\] ?(.*)/)[2];
              testArray[9] = new Roll(`${rollheal}`).evaluate({ async: false }).result + ' ' + newHealTime;
            } else {
              testArray[9] = 'None';
            }
          }
          switch (testArray[3]) {
            case 'Yes ':
              cFatal = true;
              break;
            case 'Yes, –1 ':
              cFatal = true;
              break;
            default:
              cFatal = false;
              break;
          }

          switch (testArray[5]) {
            case game.i18n.localize('TWD.None') + ' ':
              healTime = 0;
              break;
            case game.i18n.localize('TWD.OneRound') + ' ':
              healTime = 1;
              break;
            case game.i18n.localize('TWD.OneTurn') + ' ':
              healTime = 2;
              break;
            case game.i18n.localize('TWD.OneShift') + ' ':
              healTime = 3;
              break;
            case game.i18n.localize('TWD.OneDay'):
              +' ';
              healTime = 3;
              break;
            case game.i18n.localize('TWD.AMinute'):
              +' ';
              healTime = 4;
              break;
            default:
              healTime = 0;
              break;
          }
          //
          // Now create the item on the sheet
          //
          let rollData = {
            type: 'critical-injury',
            img: resultImage,
            name: `#${test1.roll._total} ${testArray[1]}`,
            'data.attributes.fatal': cFatal,
            'data.attributes.timelimit.value': healTime,
            'data.attributes.healingtime.value': testArray[9],
            'data.attributes.effects': speanex,
          };

          await this.createEmbeddedDocuments('Item', [rollData]);

          //
          // Prepare the data for the chat message
          //

          hFatal = testArray[3] != ' ' ? testArray[3] : 'None';
          hHealTime = testArray[9] != ' ' ? testArray[9] : 'None';
          hTimeLimit = testArray[5] != ' ' ? testArray[5] : 'None';

          htmlData = {
            actorname: actor.name,
            img: resultImage,
            name: `#${test1.roll._total} ${testArray[1]}`,
            fatal: hFatal,
            timelimit: hTimeLimit,
            healingtime: hHealTime,
            effects: speanex,
          };
        }

        break;

    }

    // Now push the correct chat message

    // console.log(htmlData);
    const html = await renderTemplate(`systems/twd/templates/chat/crit-roll-${actor.type}.html`, htmlData);

    let chatData = {
      user: game.user.id,
      speaker: {
        actor: actor.id,
      },
      content: html,
      other: game.users.contents.filter((u) => u.isGM).map((u) => u.id),
      sound: CONFIG.sounds.dice,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
    };

    ChatMessage.applyRollMode(chatData, game.settings.get('core', 'rollMode'));
    return ChatMessage.create(chatData);
    // }
    // } catch (error) { }
  }

  async rollCritMan(actor, type, dataset) {
    function myRenderTemplate(template) {
      let confirmed = false;
      renderTemplate(template).then((dlg) => {
        new Dialog({
          title: game.i18n.localize('TWD.RollManCrit'),
          content: dlg,
          buttons: {
            one: {
              icon: '<i class="fas fa-check"></i>',
              label: game.i18n.localize('TWD.DialRoll'),
              callback: () => (confirmed = true),
            },
            four: {
              icon: '<i class="fas fa-times"></i>',
              label: game.i18n.localize('TWD.DialCancel'),
              callback: () => (confirmed = false),
            },
          },
          default: 'one',
          close: (html) => {
            if (confirmed) {
              let manCrit = html.find('[name=manCrit]')[0]?.value;

              if (manCrit == 'undefined') {
                manCrit = '1';
              }
              switch (type) {
                case 'character':
                  if (!manCrit.match(/^[1-6]?[1-6]$/gm)) {
                    ui.notifications.warn(game.i18n.localize('TWD.NoCharCrit'));
                    return;
                  }
                  break;
                default:
                  break;
              }
              actor.rollCrit(actor, type, dataset, manCrit);
            }
          },
        }).render(true);
      });
    }
    switch (actor.type) {
      case 'character':
        myRenderTemplate('systems/twd/templates/dialog/roll-char-manual-crit-dialog.html');
        break;

      default:
        break;
    }
  }
  /* ------------------------------------------- */
  /*  Vehicle: Crew Management                   */
  /* ------------------------------------------- */

  /**
   * Adds an occupant to the vehicle.
   * @param {string}  crewId              The id of the added actor
   * @param {string}  [position='PASSENGER'] Crew position flag ('PASSENGER', 'DRIVER', 'GUNNER', or 'COMMANDER')
   * @param {boolean} [isExposed=false]   Whether it's an exposed position
   * @returns {VehicleOccupant}
   */
  addVehicleOccupant(crewId, position = 'PASSENGER') {
    if (this.type !== 'vehicles') return;
    if (!TWD.vehicle.crewPositionFlags.includes(position)) {
      throw new TypeError(`twd | addVehicleOccupant | Wrong position flag: ${position}`);
    }
    const data = this.system;
    // if (!(data.crew.occupants instanceof Array)) {
    //   data.crew.occupants = [];
    // }
    const occupant = {
      id: crewId,
      position,
    };
    // Removes duplicates.
    if (data.crew.occupants.some((o) => o.id === crewId)) this.removeVehicleOccupant(crewId);
    // Adds the new occupant.
    data.crew.occupants.push(occupant);
    this.update({ 'data.crew.occupants': data.crew.occupants });
    return occupant;
  }

  /* ------------------------------------------- */

  /**
   * Removes an occupant from the vehicle.
   * @param {string} crewId The id of the occupant to remove
   * @return {VehicleOccupant[]}
   */
  removeVehicleOccupant(crewId) {
    if (this.type !== 'vehicles') return;
    const crew = this.system.crew;
    crew.occupants = crew.occupants.filter((o) => o.id !== crewId);
    return crew.occupants;
  }

  /* ------------------------------------------- */

  /**
   * Gets a specific occupant in the vehicle.
   * @param {string} crewId The id of the occupant to find
   * @returns {VehicleOccupant|undefined}
   */
  getVehicleOccupant(crewId) {
    if (this.type !== 'vehicles') return;
    return this.system.crew.occupants.find((o) => o.id === crewId);
  }

  /* ------------------------------------------- */

  /**
   * Gets a collection of crewed actors.
   * @returns {Collection<string, Actor>} [id, actor]
   */
  getCrew() {
    if (this.type !== 'vehicle') return undefined;
    const c = new foundry.utils.Collection();
    for (const o of this.system.crew.occupants) {
      c.set(o.id, game.actors.get(o.id));
    }
    return c;
  }
}
export default twdActor;
