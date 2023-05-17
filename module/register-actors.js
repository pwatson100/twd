import twdActorSheet from './actor/actor-sheet.js';
// import twdSynthActorSheet from './actor/actor-sheet.js';
// import twdSynthActorSheet from './actor/synth-sheet.js';
// import ActorSheetTwdVehicle from './actor/actor-sheet.js';
// import ActorSheetTwdCreat from './actor/actor-sheet.js';
// import ActorSheetTwdTerritory from './actor/actor-sheet.js';
// import twdSpacecraftSheet from './actor/spacecraft-sheet.js';

function registerActors() {
  Actors.unregisterSheet('core', ActorSheet); // Register Character Sheet

  Actors.registerSheet('twd', twdActorSheet, {
    types: ['character', 'territory', 'vehicles'],
    makeDefault: true,
  });

  //   Actors.registerSheet('twd', twdActorSheet, {
  //     types: ['character'],
  //     makeDefault: true,
  //   });

  //   Actors.registerSheet('twd', twdSynthActorSheet, {
  //     types: ['synthetic'],
  //     makeDefault: true,
  //   });

  // Actors.registerSheet('twd', ActorSheetTwdVehicle, {
  //   types: ['vehicles'],
  //   makeDefault: true,
  // }); // Register vehicle Sheet

  // Actors.registerSheet('twd', twdSpacecraftSheet, {
  //   types: ['spacecraft'],
  //   makeDefault: true,
  // }); // Register vehicle Sheet

  // console.warn('Reg: Got here');

  // Actors.registerSheet('twd', ActorSheetTwdCreat, {
  //   types: ['creature'],
  //   makeDefault: true,
  // }); // Register vehicle Sheet

  // Actors.registerSheet('twd', ActorSheetTwdTerritory, {
  //   types: ['territory'],
  //   makeDefault: true,
  // }); // Register Territory Sheet
}

export default registerActors;
