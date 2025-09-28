export const tasksData = {
  gatheringTasks: [
    {
      id: 'vine_bridge',
      name: 'Vine Bridge',
      waypoint: '[&BIYHAAA=]',
      availability: {
        times: [
          "00:50","01:50","02:50","03:50","04:50","05:50","06:50","07:50","08:50","09:50","10:50","11:50","12:50",
          "13:50","14:50","15:50","16:50","17:50","18:50","19:50","20:50","21:50","22:50","23:50"
        ],
        duration: 10
      }
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