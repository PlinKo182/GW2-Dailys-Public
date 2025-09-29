export const tasksData = {
  gatheringTasks: [
    {
      id: 'vine_bridge',
      name: 'Vine Bridge',
      waypoint: '[&BIYHAAA=]'
    },
    { id: 'prosperity', name: 'Prosperity', waypoint: '[&BHoHAAA=]' },
    { id: 'destinys_gorge', name: "Destiny's Gorge", waypoint: '[&BJMKAAA=]' }
  ],

  craftingTasks: [
    { id: 'mithrillium', name: 'Lump of Mithrillium' },
    { id: 'elonian_cord', name: 'Spool of Thick Elonian Cord' },
    { id: 'spirit_residue', name: 'Glob of Elder Spirit Residue' },
    { id: 'gossamer', name: 'Gossamer Stuffing' }
  ],

  specialTasks: [
    { id: 'psna', name: getPSNAName(), waypoint: getPSNAWaypoint() },
    { id: 'home_instance', name: 'Home Instance', waypoint: '[&BLQEAAA=]' }
  ]
};

// PSNA helpers
function getPSNAName() {
  const psnaData = {
    0: "Repair Station",       // Sunday
    1: "Restoration Refuge",   // Monday
    2: "Camp Resolve",         // Tuesday
    3: "Town of Prosperity",   // Wednesday
    4: "Blue Oasis",           // Thursday
    5: "Repair Station",       // Friday
    6: "Camp Resolve"          // Saturday
  };
  return `PSNA: ${psnaData[new Date().getDay()]}`;
}

function getPSNAWaypoint() {
  const psnaWaypoints = {
    0: "[&BIkHAAA=]", // Sunday
    1: "[&BKsHAAA=]", // Monday
    2: "[&BH8HAAA=]", // Tuesday
    3: "[&BH4HAAA=]", // Wednesday
    4: "[&BKsHAAA=]", // Thursday
    5: "[&BJQHAAA=]", // Friday
    6: "[&BH8HAAA=]"  // Saturday
  };
  return psnaWaypoints[new Date().getDay()];
}