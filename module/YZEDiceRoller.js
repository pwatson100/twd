export class yze {
  /**
   * YZEDice RollFunction.
   * Param for number of dice to roll for each die type/rolls
   * @param {Text} actor - Passed actor data
   * @param {Text} actortype - Passed actor type
   * @param {Boolean} blind - True or False
   * @param {Boolean} reRoll - True or False
   * @param {Text} label - The skill/item being rolled against
   * @param {number} r1Dice - Number of dice
   * @param {Text} col1 - The Colour
   * @param {number} r2Dice  - Number of dice
   * @param {Text} col2 - The Colour
   * @param {Text} tLabel - Spare label for future use
   * @param {number} sCount - Count of last number of successes to add to the push reroll
   *
   * rollArr is a globally defined array to store all one's and sixes and number of dice rolled for each type
   *   game.twd.rollArr = { r1Dice: 0, r1One: 0, r1Six: 0, r2Dice: 0, r2One: 0, r2Six: 0, tLabel: '' , sCount: 0 };
   *
   * Call Example:
   * const element = event.currentTarget;
   * const dataset = element.dataset;
   * let label = dataset.label;
   * let r1Data = parseInt(dataset.roll || 0);
   * let r2Data = this.actor.getRollData().stress;
   * let reRoll = false;
   * yze.yzeRoll(actortype, blind, reRoll, label, r1Data, 'Black', r2Data, 'Yellow');
   *
   */
  static async yzeRoll(actortype, blind, reRoll, label, r1Dice, col1, r2Dice, col2, actorid, itemid, tactorid) {
    // console.log('yze -> yzeRoll -> actortype, blind, reRoll, label, r1Dice, col1, r2Dice, col2', actortype, blind, reRoll, label, r1Dice, col1, r2Dice, col2);
    // *******************************************************
    // Store the version number of FVTT
    // *******************************************************
    // const sysVer = game.data.version;

    // *******************************************************
    // Is Dice So Nice enabled ?
    // *******************************************************
    let niceDice = '';

    try {
      niceDice = true;
      game.settings.get('dice-so-nice', 'settings').enabled;
    } catch {
      niceDice = false;
    }
    let spud = false;

    // *******************************************************
    //  Initialise the chat message
    // *******************************************************
    let chatMessage = `<div class="chatBG" data-item-id="` + itemid + `" data-actor-id="` + actorid + `">`;

    // *******************************************************
    //  Data structure for DsN V3
    // *******************************************************
    let mr = '';
    let roll1;

    // *******************************************************
    // Set up text for a roll or push
    // *******************************************************
    let rType = '';
    // if (reRoll && (hostile === true) === 'character') {
    if ((reRoll && actortype === 'character' && label != 'Armor' && label != 'Radiation') || reRoll === 'mPush') {
      rType = game.i18n.localize('TWD.Push');
    } else {
      rType = game.i18n.localize('TWD.Rolling');
    }

    // *******************************************************
    // Save the successes from the last roll
    // *******************************************************
    let oldRoll = game.twd.rollArr.r1Six + game.twd.rollArr.r2Six;
    // game.twd.rollArr.multiPush += game.twd.rollArr.r1Six + game.twd.rollArr.r2Six;

    // *******************************************************
    // Clear the global dice array
    // *******************************************************
    // game.twd.rollArr = { r1Dice: 0, r1One: 0, r1Six: 0, r2Dice: 0, r2One: 0, r2Six: 0, tLabel: '' };
    game.twd.rollArr.r1Dice = 0;
    game.twd.rollArr.r1One = 0;
    game.twd.rollArr.r1Six = 0;
    game.twd.rollArr.r2Dice = 0;
    game.twd.rollArr.r2One = 0;
    game.twd.rollArr.r2Six = 0;
    game.twd.rollArr.sCount = 0;
    game.twd.rollArr.tLabel = '';

    // *******************************************************
    // Setup the constants for the 3D dice roll V2 method
    // *******************************************************
    const data = {
      formula: '',
      results: [],
    };
    if (!r1Dice && !r2Dice) {
      return ui.notifications.warn(game.i18n.localize('TWD.NoAttribute'));
    }
    // *******************************************************
    // Handle Base Dice Roll
    // *******************************************************
    chatMessage += '<h2 class="alienchatwhite">' + rType + ' ' + label + ' </h2>';
    if (r1Dice >= 1) {
      roll1 = `${r1Dice}` + 'db';
      if (r2Dice <= 0) {
        mr = new Roll(`${roll1}`).evaluate({ async: false });
        // await mr.evaluate({ async: true });
        buildChat(mr, r1Dice, game.i18n.localize('TWD.Base'));
        // console.log('yze -> yzeRoll -> mr', mr);
      }
    } else {
      if (r1Dice < 0) {
        r2Dice = r2Dice + r1Dice
        if (r2Dice < 1) {
          return ui.notifications.warn(game.i18n.localize('TWD.NoDice'));
        }
      }
      roll1 = 0 + 'db';
    }

    // *******************************************************
    // Handle Stress Dice Roll
    // *******************************************************

    if (r2Dice >= 1) {
      let roll2 = `${r2Dice}` + 'ds';
      let com;
      if (actortype === 'supply') {
        if (r2Dice > 6) {
          r2Dice = 6;
          com = `${r2Dice}` + 'ds';
        } else {
          // // console.log('yze -> yzeRoll -> hostile', hostile);
          com = `${roll2}`;
        }
      } else {
        com = `${roll1}` + '+' + `${roll2}`;
        // mr = '';
      }

      mr = new Roll(`${com}`).evaluate({ async: false });
      // await mr.evaluate({ async: true });
      // // console.log('yze -> yzeRoll -> mr', mr);
      buildChat(mr, r1Dice, 'Stress');

      // *******************************************************
      // Set reroll
      // *******************************************************
      // debugger;
      if (game.twd.rollArr.r2One > 0) {
        if (reRoll === 'push' || reRoll === 'mPush') {
          spud = true;
        }
        reRoll = true;
      }

      // *******************************************************
      // Display message if there is a 1> on the stress dice.  Display appropriate message if its a Supply roll.
      // *******************************************************
      if (actortype != 'supply') {
        if (game.twd.rollArr.r2One >= 1) {
          chatMessage += '<div class="warnblink alienchatred"; style="font-weight: bold; font-size: larger">' + game.i18n.localize('TWD.rollStress') + '</div>';
        }
      } else if (game.twd.rollArr.r2One >= 1) {
        chatMessage += '<div class="alienchatblue warnblink"; style="font-weight: bold; font-size: larger">' + game.i18n.localize('TWD.supplyDecreases') + '</div>';
      }
    }
    // *******************************************************
    // Calculate the total successes and display as long as it's not a Supply roll.
    // *******************************************************

    function localizedCountOfSuccesses(sTotal) {
      if (label === 'Radiation') {
        if (sTotal >= 1) {
          return sTotal + ' ' + '<span class="warnblink alienchatred"; style="font-weight: bold; font-size: larger">' + game.i18n.localize('TWD.healthDamage') + '</span>';
          // return sTotal + ' ' + game.i18n.localize('TWD.healthDamage');
        } else {
          return sTotal + ' ' + game.i18n.localize('TWD.healthDamage');
        }
      } else {
        if (sTotal === 1) return '1 ' + game.i18n.localize('TWD.sucess');
        else return sTotal + ' ' + game.i18n.localize('TWD.sucesses');
      }
    }

    if (actortype != 'supply') {
      if (label === 'Radiation') {
        if (game.twd.rollArr.r1Six + game.twd.rollArr.r2Six + game.twd.rollArr.sCount >= 1) {
          chatMessage +=
            '<div class="warnblink alienchatred"; style="font-weight: bold; font-size: larger">' +
            game.i18n.localize('TWD.youTake') +
            ' ' +
            localizedCountOfSuccesses(game.twd.rollArr.r1Six + game.twd.rollArr.r2Six + game.twd.rollArr.sCount) +
            ' </div>';
        } else {
          chatMessage +=
            '<div class="alienchatlightblue">' +
            game.i18n.localize('TWD.youTake') +
            ' ' +
            localizedCountOfSuccesses(game.twd.rollArr.r1Six + game.twd.rollArr.r2Six + game.twd.rollArr.sCount) +
            ' </div>';
        }
      } else {
        chatMessage +=
          '<div class="alienchatlightblue">' +
          game.i18n.localize('TWD.youHave') +
          ' ' +
          localizedCountOfSuccesses(game.twd.rollArr.r1Six + game.twd.rollArr.r2Six + game.twd.rollArr.sCount) +
          ' </div>';
      }
    }

    // *******************************************************
    //  If it's a Push roll and display the total for both rolls.
    // *******************************************************
    // if (reRoll === 'push' || (reRoll === 'mPush' && actortype === 'character' && label != 'Armor')) {
    if (reRoll === 'push' || (reRoll === 'mPush' && actortype === 'character' && label != 'Armor')) {
      chatMessage +=
        '<hr>' +
        '<div class="alienchatlightblue"' +
        game.i18n.localize('TWD.followingPush') +
        '<br>' +
        game.i18n.localize('TWD.totalOf') +
        ' ' +
        localizedCountOfSuccesses(oldRoll + game.twd.rollArr.multiPush + game.twd.rollArr.r1Six + game.twd.rollArr.r2Six) +
        ' </div>';
      game.twd.rollArr.multiPush = oldRoll;
      // console.log('spud');
    }
    if (spud) {
      chatMessage +=
        '<hr>' +
        '<div class="alienchatlightblue">' +
        game.i18n.localize('TWD.followingPush') +
        '<br>' +
        game.i18n.localize('TWD.totalOf') +
        ' ' +
        localizedCountOfSuccesses(oldRoll + game.twd.rollArr.multiPush + game.twd.rollArr.r1Six + game.twd.rollArr.r2Six) +
        ' </div>';
      // game.twd.rollArr.multiPush = oldRoll;
      // console.log('spud');
    }

    // *******************************************************
    // Render the reroll button
    // *******************************************************

    if (!reRoll || reRoll === 'mPush') {
      if (reRoll != 'mPush') {
        chatMessage += `<span style="font-size:larger">` + game.i18n.localize('TWD.MultiPush') + ` ` + `</span> <input class="multiPush" name="multiPush" type="checkbox" {{checked false}} /> `;
      }
      // chatMessage += `<button class="alien-Push-button" title="PUSH Roll?" style="color: #adff2f; font-weight: bold; font-size: xxx-large">` + game.i18n.localize('TWD.Push') + `</button>`;
      chatMessage += `<button class="alien-Push-button" title="PUSH Roll?">` + game.i18n.localize('TWD.Push') + `</button>`;
      chatMessage += `<span class="dmgBtn-container" style="position:absolute; right:0; bottom:1px;"></span>`;
      chatMessage += `<span class="dmgBtn-container" style="position:absolute; top:0; right:0; bottom:1px;"></span>`;
    }
    // *******************************************************
    // For FVTT v0.7.x and DsN V3 set the appropriate chat config
    // *******************************************************

    if (!blind) {
      ChatMessage.create({
        user: game.user.id,
        speaker: {
          actor: actorid,
          // alias: tactorid,
        },
        content: chatMessage,
        other: game.users.contents.filter((u) => u.isGM).map((u) => u.id),
        sound: CONFIG.sounds.dice,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        roll: mr,
        rollMode: game.settings.get('core', 'rollMode'),
      });
    } else {
      ChatMessage.create({
        user: game.user.id,
        speaker: {
          actor: actorid,
        },
        content: chatMessage,
        whisper: game.users.contents.filter((u) => u.isGM).map((u) => u.id),
        blind: true,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        roll: mr,
        rollMode: game.settings.get('core', 'rollMode'),
      });
    }
    // }

    // *******************************************************
    // Function to build chat and dice for DsN V3
    // *******************************************************
    function buildChat(mr, numDie, dType) {
      let numbers = [];
      let numbers2 = [];
      let R6 = 0;
      let R1 = 0;
      let RB6 = 0;
      let RB1 = 0;
      let RY6 = 0;
      let RY1 = 0;
      let mrterms;
      game.twd.rollArr.tLabel = label;

      if (dType != 'Stress') {
        for (let index = 0; index < mr.terms[0].results.length; index++) {
          let spanner = flattenObj(mr.terms[0].results[index]);
          numbers.push(spanner.result);
        }
        R6 = numbers.filter(myFunSix);
        R1 = numbers.filter(myFunOne);
        game.twd.rollArr.r1Dice = numDie;
        game.twd.rollArr.r1Six = R6.length;
        game.twd.rollArr.r1One = R1.length;
        let numOf6s = R6.length; // added by Steph
        let numOf1s = R1.length; // added by Steph
        chatMessage += '<div <span class="alienchatlightgreen" style="font-size:larger">' + col1 + '  ' + r1Dice + ' ' + game.i18n.localize('TWD.Dice') + '</div>';
        chatMessage += '<span <span class="alienchatlightgreen" style="font-size:larger"> ' + game.i18n.localize('TWD.Sixes') + '</span>';
        chatMessage += `${R6.length}`;
        chatMessage += '<div>';
        // added by Steph (for loop, and moved div close)
        for (var _d = 0; _d < numDie; _d++) {
          if (numOf6s > 0) {
            chatMessage += "<span class='alien-diceface-b6'></span>";
            numOf6s--;
          } else {
            chatMessage += "<span class='alien-diceface-b0'></span>";
          }
        }
        chatMessage += '</div>';
      } else {
        if (actortype != 'supply') {
          for (let index = 0; index < mr.terms[0].results.length; index++) {
            let spanner = flattenObj(mr.terms[0].results[index]);
            numbers.push(spanner.result);
          }
          RB6 = numbers.filter(myFunSix);
          RB1 = numbers.filter(myFunOne);
          game.twd.rollArr.r1Dice = mr.terms[0].number;
          game.twd.rollArr.r1Six = RB6.length;
          game.twd.rollArr.r1One = RB1.length;
          let numOfB6s = RB6.length; // added by Steph
          let numOfB1s = RB1.length; // added by Steph
          // Base Dice
          chatMessage += '<div <span class="alienchatlightgreen" style="font-size:larger"> ' + col1 + '  ' + r1Dice + ' ' + game.i18n.localize('TWD.Dice') + '</div>';
          chatMessage += '<span class="alienchatlightgreen" style="font-size:larger"> ' + game.i18n.localize('TWD.Sixes') + '</span>';
          chatMessage += `${RB6.length}`;
          chatMessage += '<div>';
          // added by Steph (for loop, and moved div close)
          for (var _d = 0; _d < mr.terms[0].number; _d++) {
            if (numOfB6s > 0) {
              chatMessage += "<span class='alien-diceface-b6'></span>";
              numOfB6s--;
            } else {
              chatMessage += "<span class='alien-diceface-b0'></span>";
            }
          }
          chatMessage += '</div>';
        }
        if (actortype === 'supply') {
          for (let index = 0; index < mr.terms[0].results.length; index++) {
            let spanner = flattenObj(mr.terms[0].results[index]);
            numbers.push(spanner.result);
          }
          game.twd.rollArr.r2Dice = mr.terms[0].number;
          mrterms = mr.terms[0].number;
          RY6 = numbers.filter(myFunSix);
          RY1 = numbers.filter(myFunOne);
        } else {
          for (let index = 0; index < mr.terms[2].results.length; index++) {
            let spanner = flattenObj(mr.terms[2].results[index]);
            numbers2.push(spanner.result);
          }
          game.twd.rollArr.r2Dice = mr.terms[2].number;
          mrterms = mr.terms[2].number;
          RY6 = numbers2.filter(myFunSix);
          RY1 = numbers2.filter(myFunOne);
        }

        game.twd.rollArr.r2Six = RY6.length;
        game.twd.rollArr.r2One = RY1.length;

        let numOfY6s = RY6.length; // added by Steph
        let numOfY1s = RY1.length; // added by Steph

        // Yellow Dice
        chatMessage += '<div class="alienchatgoldenrod" style="font-size:larger">' + col2 + '  ' + r2Dice + ' ' + game.i18n.localize('TWD.Dice') + '</div>';
        chatMessage += '<span class="alienchatred">' + game.i18n.localize('TWD.Ones') + ' </span>';
        chatMessage += `<span>${RY1.length}&nbsp;&nbsp;&nbsp;</span>`;
        chatMessage += '<span class="alienchatlightgreen" style="font-size:larger">' + game.i18n.localize('TWD.Sixes') + '</span>';
        chatMessage += `${RY6.length}`;
        chatMessage += '<div>';
        // added by Steph (for loops, and moved div close)
        for (var _d = 0; _d < numOfY6s; _d++) {
          chatMessage += "<span class='alien-diceface-y6'></span>";
        }
        for (var _d = 0; _d < numOfY1s; _d++) {
          chatMessage += "<span class='alien-diceface-y1'></span>";
        }
        let _theRest = mrterms - (numOfY6s + numOfY1s);
        for (var _d = 0; _d < _theRest; _d++) {
          chatMessage += "<span class='alien-diceface-y0'></span>";
        }
        chatMessage += '</div>';
      }
      function myFunSix(value, index, array) {
        return value === 6;
      }
      function myFunOne(value, index, array) {
        return value === 1;
      }
    }

    // *******************************************************
    // Function to flatten Arrays to make them easier to parse
    // *******************************************************
    function flattenObj(obj, parent, res = {}) {
      for (let key in obj) {
        let propName = parent ? parent + '_' + key : key;
        if (typeof obj[key] == 'object') {
          flattenObj(obj[key], propName, res);
        } else {
          res[propName] = obj[key];
        }
      }
      return res;
    }
  }
}
