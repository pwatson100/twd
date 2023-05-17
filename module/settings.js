import { AlienConfig } from './twdRPGConfig.js';

export default function () {
  // Register system settings
  game.settings.register('twd', 'macroShorthand', {
    name: 'TWD.DefMacro',
    hint: 'TWD.DefMacroHint',
    scope: 'world',
    type: Boolean,
    default: true,
    config: true,
  });

  game.settings.registerMenu('twd', 'twdSettings', {
    name: 'TWD.MenuName',
    label: 'TWD.MenuLabel',
    hint: 'TWD.MenuHint',
    icon: 'fas fa-palette',
    type: AlienConfig,
    restricted: false,
  });

  // register setting for add/remove menu button
  game.settings.register('twd', 'addMenuButton', {
    name: 'TWD.AddMenuName',
    hint: 'TWD.AddMenuHint',
    scope: 'world',
    config: true,
    default: AlienConfig.getDefaults.addMenuButton,
    type: Boolean,
    onChange: (enabled) => {
      AlienConfig.toggleConfigButton(enabled);
    },
  });

  // Register system settings
  game.settings.register('twd', 'fontColour', {
    name: 'TWD.Fontpick',
    label: 'TWD.Colpick',
    hint: 'TWD.ColpickHint',
    icon: 'fas fa-dice-d20',
    restricted: false,
    type: String,
    config: false,
    scope: 'client',
    default: '#adff2f',
  });

  game.settings.register('twd', 'fontStyle', {
    name: 'TWD.FontStyle',
    label: 'TWD.StylePicker',
    hint: 'TWD.StylePickerHint',
    icon: 'fas fa-cogs',
    restricted: false,
    scope: 'client',
    type: String,
    config: false,
    default: 'OCR-A',
  });

  game.settings.register('twd', 'alienitemselect', {
    name: 'TWD.FontStyle',
    restricted: false,
    scope: 'client',
    type: String,
    config: false,
    default: '#e0f287',
  });

  game.settings.register('twd', 'aliendarkergreen', {
    name: 'TWD.FontStyle',
    restricted: false,
    scope: 'client',
    type: String,
    config: false,
    default: '#29a253',
  });
  game.settings.register('twd', 'alienoddtab', {
    name: 'TWD.FontStyle',
    restricted: false,
    scope: 'client',
    type: String,
    config: false,
    default: '#14160c',
  });
  game.settings.register('twd', 'aliencrt', {
    name: 'TWD.FontStyle',
    restricted: false,
    scope: 'client',
    type: Boolean,
    config: false,
    default: false,
  });

  game.settings.register('twd', 'defaultTokenSettings', {
    name: 'TWD.DefProto',
    hint: 'TWD.DefProtoHint',
    scope: 'world',
    config: true,
    default: true,
    type: Boolean,
  });
  game.settings.register('twd', 'systemMigrationVersion', {
    name: 'System Migration Version',
    scope: 'world',
    config: false,
    type: String,
    default: 0,
  });

  game.settings.register('twd', 'switchMouseKeys', {
    name: 'TWD.SwitchKeys',
    hint: 'TWD.SwitchKeysHint',
    scope: 'client',
    type: Boolean,
    default: false,
    config: true,
    onChange: () => {
      location.reload();
    },
  });

  game.settings.register('twd', 'twdDevMessageVersionNumber', {
    name: 'Message from the devs',
    hint: 'Used to track last message id from the Alien RPG devs',
    scope: 'world',
    config: false,
    default: 0,
    type: Number,
  });

  game.settings.register('twd', 'twdHideInitChat', {
    name: 'TWD.hideInitChat',
    hint: 'TWD.hideInitChatHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean,
  });

  game.settings.register('twd', 'switchJournalColour', {
    name: 'TWD.hideJournalBGImage',
    hint: 'TWD.hideJournalBGImageNote',
    scope: 'client',
    type: Boolean,
    default: false,
    config: true,
    onChange: () => {
      location.reload();
    },
  });
  game.settings.register('twd', 'JournalFontColour', {
    name: 'TWD.Fontpick',
    label: 'TWD.Colpick',
    hint: 'TWD.ColpickHint',
    icon: 'fas fa-dice-d20',
    restricted: false,
    type: String,
    config: false,
    scope: 'client',
    default: '#b1e0e7',
  });
  game.settings.register('twd', 'switchchatbackground', {
    name: 'TWD.hideChatBGImage',
    hint: 'TWD.hideChatBGImageNote',
    scope: 'client',
    type: Boolean,
    default: false,
    config: true,
    onChange: () => {
      location.reload();
    },
  });

  game.settings.register('twd', 'ARPGSemaphore', {
    name: 'Semaphore Flag',
    hint: 'Flag for running sequential actions/scripts',
    scope: 'world',
    type: String,
    config: false,
    default: '',
  });

}


