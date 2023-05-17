// Namespace Alien Configuration Values
export const TWD = {};

/**
 * The set of ability scores used with the system
 * @type {Object}
 */
TWD.attributes = {
  str: 'TWD.AbilityStr',
  wit: 'TWD.AbilityWit',
  agl: 'TWD.AbilityAgl',
  emp: 'TWD.AbilityEmp',
};
TWD.skills = {
  heavyMach: 'TWD.SkillheavyMach',
  closeCbt: 'TWD.SkillcloseCbt',
  stamina: 'TWD.Skillstamina',
  rangedCbt: 'TWD.SkillrangedCbt',
  mobility: 'TWD.Skillmobility',
  piloting: 'TWD.Skillpiloting',
  command: 'TWD.Skillcommand',
  manipulation: 'TWD.Skillmanipulation',
  medicalAid: 'TWD.SkillmedicalAid',
  observation: 'TWD.Skillobservation',
  survival: 'TWD.Skillsurvival',
  comtech: 'TWD.Skillcomtech',
};
TWD.general = {
  career: 'TWD.Career',
  appearance: 'TWD.Apparance',
  sigItem: 'TWD.SignatureItem',
};
TWD.physicalItems = [];
// TWD.physicalItems = ['item', 'weapon', 'armor', 'talent', 'planet-system', 'agenda', 'specialty', 'critical-injury'];

TWD.conditionEffects = [
  {
    id: 'starving',
    label: 'TWD.Starving',
    icon: 'systems/twd/images/starving.webp',
  },
  {
    id: 'dehydrated',
    label: 'TWD.Dehydrated',
    icon: 'systems/twd/images/water-flask.webp',
  },
  {
    id: 'exhausted',
    label: 'TWD.Exhausted',
    icon: 'systems/twd/images/exhausted.webp',
  },
  {
    id: 'freezing',
    label: 'TWD.Freezing',
    icon: 'systems/twd/images/frozen.webp',
  },
  {
    id: 'encumbered',
    label: 'TWD.Encumbered',
    icon: 'systems/twd/images/weight.webp',
  },
  {
    id: 'panicked',
    label: 'TWD.Panicked',
    icon: 'icons/svg/terror.svg',
  },
  {
    id: 'overwatch',
    label: 'TWD.Overwatch',
    icon: 'systems/twd/images/eye-target.webp',
  },
  {
    id: 'radiation',
    label: 'TWD.Radiation',
    icon: 'icons/svg/radiation.svg',
  },
];

TWD.vehicle = {
  crewPositionFlags: ['COMMANDER', 'PILOT', 'GUNNER', 'PASSENGER'],
  crewPositionFlagsLocalized: {
    COMMANDER: 'TWD.CrewCommander',
    PILOT: 'TWD.CrewPilot',
    GUNNER: 'TWD.CrewGunner',
    PASSENGER: 'TWD.CrewPasanger',
  },
};

TWD.Icons = {
  buttons: {
    edit: '<i class="fas fa-edit"></i>',
    delete: '<i class="fas fa-trash"></i>',
    remove: '<i class="fas fa-times"></i>',
  },
};

