'use strict';
window.WB={};
WB.W=1440;WB.H=900;
WB.regions=[
 {name:'Rain Shrine · Yomi Slope',short:'Rain Shrine',art:'arena_shrine',color:'#79d7d3',boss:'guardian',intro:'Ousu awakens at the entrance to Yomi. His pursuers have found him. Get through the shrine.',enemies:['kodama','yomotsu','fox'],hazard:'Avoid being surrounded. Deal with distant foxfires first.'},
 {name:'Dusk Fields · The Emperor’s Shadow',short:'Dusk Fields',art:'arena_reeds',color:'#edbf74',boss:'father',intro:'“March farther east.” That is all the decree says. Beyond the reeds, his father’s shadow still holds the imperial seal. This time, you choose where to point your sword.',enemies:['soldier','thunder','fox'],hazard:'Imperial soldiers charge their thrusts; thunder drums fire triple volleys. Break the seals before facing the emperor.'},
 {name:'Cursed Sea · Rift to Tokoyo',short:'Cursed Sea',art:'arena_tide',color:'#c5a4e8',boss:'magatsu',intro:'The sea swallows commands and names alike. Magatsu speaks through your old wounds. The comb is still in your sleeve, a keepsake from someone who waited for your return.',enemies:['thunder','yomotsu','wraith'],hazard:'Tide wraiths split and pursue you while thunder drums weave volleys. Look for gaps in the ring of cursed tides.'}
];
WB.bosses={
 guardian:{name:'Torii Gatekeeper',title:'Gate of Yomi · First Wild Spirit',line:'“Everyone who crosses this gate must leave a name behind.”',tip:'Red circles mark the hammer’s impact. Featherstep can carry you through the guardian.',art:'guardian_portrait',sprite:6,hp:1800,r:40,speed:40},
 father:{name:'Emperor’s Shadow · Keiko',title:'Eastern Campaign · Second Wild Spirit',line:'“You are my sword. A sword has no need of a home.”',tip:'Three edict seals reduce the emperor’s damage taken. Break them to weaken his command.',art:'father_portrait',sprite:7,hp:4000,r:36,speed:30},
 magatsu:{name:'Tide of Magatsu',title:'Nameless Sea · Final Wild Spirit',line:'“Give me your pain, and I will give you a home.”',tip:'Find gaps in the ring volleys. Attacks accelerate below half HP. Save Whitebird Crossing to clear projectiles.',art:'magatsu_portrait',sprite:8,hp:6000,r:43,speed:33},
 prince:{name:'The Bloodstained Prince',title:'Puppet of the Emperor · Your Lost Self',line:'“Follow orders, and you can forget what happened.”',tip:'He uses your dash and sword waves. Dodge the edict slashes and confront your former self.',art:'prince_portrait',sprite:0,hp:7500,r:27,speed:72}
};
WB.weapons=[
 {id:'tide',name:'Kusanagi · Tides',icon:0,tag:'Tide / Pierce',text:'Each slash releases a piercing water blade that applies Wet. F releases five tide blades.',color:'#76d5d1'},
 {id:'ember',name:'Flint · Wildfire',icon:1,tag:'Flame / Melee',text:'Faster attacks and stronger close-range fire slashes. F blasts nearby enemies and ignites the ground.',color:'#f2bd70'},
 {id:'wing',name:'Whitebird · Featherblade',icon:2,tag:'Feather / Mobility',text:'Twin feathers seek enemies. Featherstep has a shorter cooldown. F releases homing feather blades.',color:'#f0e8cb'}
];
WB.talents=[
 {id:'water',name:'Tide Turn',icon:6,family:'Tide',max:4,text:'Per rank: Kusanagi auto-slash damage +12%, range +12, and water-blade pierce +1.',tags:['ranged','piercing']},
 {id:'fire',name:'Wildfire Rite',icon:7,family:'Flame',max:4,text:'Gain a periodic ring of fire. Per rank: damage +12, radius +14.',tags:['close_range','area']},
 {id:'bird',name:'Featherstep',icon:2,family:'Feather',max:4,text:'Dash cooldown −0.25 s. Dash-slash damage +18.',tags:['mobility','dash']},
 {id:'thunder',name:'Thunderchain',icon:8,family:'Thunder',max:3,text:'Lightning strikes every 2.8 s, chaining to 2 + rank nearby enemies.',tags:['chain','ranged']},
 {id:'orbit',name:'Yata Swordguard',icon:0,family:'Sword',max:3,text:'Gain an orbiting sword that cuts nearby enemies. Upgrades add more swords.',tags:['orbit','close_range']},
 {id:'return',name:'Returning Tide',icon:6,family:'Tide',max:1,rare:true,requires:'water',text:'Water blades return after reaching their limit, hitting enemies again on the way back.',tags:['returning','positioning']},
 {id:'vortex',name:'Eye of the Deep',icon:6,family:'Tide',max:2,text:'Create a vortex beneath the target every 4 s, pulling enemies in and dealing damage over time.',tags:['control','area']},
 {id:'burn',name:'Undying Flint',icon:7,family:'Flame',max:3,requires:'fire',text:'Fire hits apply a 3 s burn. Damage per second +7 per rank.',tags:['damage_over_time','fire']},
 {id:'feather',name:'Thousand Feathers',icon:2,family:'Feather',max:3,text:'Each dash launches 3 + rank homing feathers at the nearest enemy.',tags:['dash','homing']},
 {id:'steam',name:'Steam Sea',icon:7,family:'Synergy',max:1,rare:true,requires:'fusion',text:'Fire hits against Wet targets trigger a steam burst that damages nearby enemies.',tags:['synergy','area']},
 {id:'ice',name:'Frostbind',icon:6,family:'Tide',max:2,text:'Wet enemies are slowed by 18% / 30%, giving ranged builds room to move.',tags:['control','safety']},
 {id:'nova',name:'Passing Flame',icon:7,family:'Flame',max:2,text:'Every eighth kill triggers a purifying blast at the enemy’s position.',tags:['on_kill','area']},
 {id:'crit',name:'Swordheart',icon:0,family:'Sword',max:3,text:'Crit chance +12%. Critical hits deal 1.8× damage.',tags:['crit','damage']},
 {id:'ward',name:'Mirror Ward',icon:5,family:'Ward',max:3,text:'Gain one shield per combat room. Reduce incoming damage by 1 per rank.',tags:['shield','survival']},
 {id:'comb',name:'Tachibana’s Memory',icon:4,family:'Ward',max:3,text:'Max HP +18. Immediately restore 18 HP.',tags:['recovery','survival']},
 {id:'magnet',name:'Spirit Magnet',icon:3,family:'Spirit',max:3,text:'Pickup radius +45. Move speed +12.',tags:['collection','mobility']},
 {id:'leech',name:'Wild Spirit’s Thirst',icon:3,family:'Curse',max:2,text:'Restore 3 / 6 HP every 10 kills.',tags:['sustain','aggression']},
 {id:'awakening',name:'Heavenward Wish',icon:2,family:'Feather',max:3,text:'Awakening charge gain +25%. Awakening restores 8 HP per rank.',tags:['ultimate','recovery']}
];
WB.relics=[
 {id:'mirror',name:'Shard of Yata',icon:5,text:'Breaking a shield releases 12 water blades. Gain one extra shield per combat room.',tags:['shield','counter']},
 {id:'flint',name:'Yamatohime’s Flint Pouch',icon:1,text:'F leaves a purifying fire field that lasts 4 s.',tags:['skill','fire']},
 {id:'comb',name:'Comb of Hashirimizu',icon:4,text:'Restore 35 HP the first time HP falls below 30% in each combat room.',tags:['survival','recovery']},
 {id:'feather',name:'White Feather of Tokoyo',icon:2,text:'Dashing leaves an afterimage that bursts after 0.6 s, dealing 45 damage to nearby enemies.',tags:['dash','burst']},
 {id:'bead',name:'Yasakani Jewel',icon:3,text:'Gain one shield per room and three attacking orbit gems. With at least one rank each in Tide, Flame and Feather, all damage +25%.',tags:['guard','orbit','synergy']},
 {id:'drum',name:'Ancient Thunder Drum',icon:8,text:'Every third F cast instantly resets its cooldown and strikes all enemies with lightning.',tags:['skill','chain']}
];
WB.waterArts=[{id:'wave',name:'Tide Turn · Water Wave',level:0,cd:7,text:'Seven piercing waves sweep forward.',icon:6},{id:'orb',name:'Water Mirror · Drifting Orbs',level:2,cd:8,text:'Three slow water orbs pierce enemies and explode at the end of their path.',icon:6},{id:'tide',name:'Hashirimizu · Tidal Wave',level:3,cd:10,text:'Summon a wave that crosses the battlefield toward the target.',icon:6},{id:'orochi',name:'Orochi · Water God’s Slash',level:4,cd:14,text:'An eight-headed water serpent rises beneath you and repeatedly slashes nearby enemies.',icon:6}];
WB.bossKey=()=>WB.act===2&&WB.shadowFinal?'prince':WB.regions[WB.act].boss;
WB.enemyDefs={
 kodama:{name:'Lantern Kodama',sprite:1,hp:30,speed:55,r:18,color:'#97bd92'},
 yomotsu:{name:'Yomi Pursuer',sprite:2,hp:24,speed:116,r:17,color:'#d4b2a6'},
 thunder:{name:'Thunder Drum',sprite:3,hp:40,speed:44,r:20,color:'#b69adb'},
 soldier:{name:'Imperial Soldier',sprite:4,hp:70,speed:51,r:22,color:'#d0ad70'},
 fox:{name:'Foxfire',sprite:5,hp:32,speed:69,r:17,color:'#e88c7d'},
 wraith:{name:'Tide Wraith',sprite:2,hp:47,speed:80,r:19,color:'#b9a5d8'}
};
