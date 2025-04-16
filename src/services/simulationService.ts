// src/services/simulationService.ts
// Ottimizzato 2025‑04‑17 – DFS con pruning, memo, early‑exit, caching
// Logica: dynamic increment per PlayStyle/PlayStyle+, SM e WF, propagazione sub‑stat

/* -------------------------------------------------------------------------- */
/*  TIPI E COSTANTI                                                           */
/* -------------------------------------------------------------------------- */

export interface Stats {
  ovr: number; pac: number; sho: number; pas: number;
  dri: number; def: number; phy: number;
  skillMoves: number; weakFoot: number;
}

export interface SimulationResult {
  playerName: string;
  initialStats: Stats;
  score: number;
  evolutionOrder: string[];
  playstyles: string[];
  playstylesPlus: string[];
  roles: string[];
  finalStats: Stats;
  deadline: Date;
  fullStatsBefore: Record<string,number>;
  fullStats:       Record<string,number>;
}

export interface Evolution {
  id: string; name: string; unlock_date: string; expires_on: string; cost: string;
  requirements: Record<string,string>;
  total_upgrades?: Record<string,string>;
  challenges: string[];
  upgrades: { step: number; description: string[]; effects: Record<string,number> }[];
  new_positions: string[];
  playstyles_added: string[];
  playstyles_plus_added: string[];
  final_bonus: Record<string,string> | {};
  url: string;
}

export interface Player {
  id: number; Name: string; OVR: number; PAC: number; SHO: number; PAS: number;
  DRI: number; DEF: number; PHY: number;
  Position: string; alternativePositions: string[];
  'play style': string; weakFoot: number; skillMoves: number;
  fullStats?: Record<string,number>;
}

export type NodeState = {
  stats  : Stats;
  plainPS: number;
  plusPS : number;
  roles  : Set<string>;
  rarity : string;
  deadline: Date;
};

const FACE_STAT_MAX           = 99;
const MAX_OUTCOMES_PER_PLAYER = 128;
const MEMO_LIMIT              = 10_000;

/* -------------------------------------------------------------------------- */
/*  FUNZIONE PRINCIPALE                                                       */
/* -------------------------------------------------------------------------- */

export async function runSimulationPage(
  selectedEvos: Evolution[],
  targetRole : string,
  skip       : number,
  limit      : number,
  searchQuery = ''
): Promise<SimulationResult[]> {

  const players = await cachedPlayers();
  const today   = new Date();

  const filtered = players.filter(p => {
    const main = p.Position.toUpperCase();
    const alts = p.alternativePositions.map(r => r.toUpperCase());
    return main === targetRole.toUpperCase() || alts.includes(targetRole.toUpperCase());
  });

  const validEvos = selectedEvos.filter(e => new Date(e.expires_on) >= today);
  if (!validEvos.length) return [];

  const wanted  = skip + limit;
  const results : SimulationResult[] = [];
  let   matched = 0;

  for (const player of filtered) {
    const sequences = findEvoSequencesDFS(player, validEvos, wanted - results.length);

    for (const seq of sequences) {
      const outcome = simulateEvoSequence(player, seq);
      if (!outcome.success) continue;

      const sim: SimulationResult = {
        playerName      : player.Name,
        initialStats    : buildInitialStats(player),
        score           : calculateCustomScore(outcome.finalStats, outcome.fullStats),
        evolutionOrder  : seq.map(e => e.name),
        playstyles      : outcome.playstyles,
        playstylesPlus  : outcome.playstylesPlus,
        roles           : outcome.roles,
        finalStats      : outcome.finalStats,
        deadline        : outcome.deadline,
        fullStatsBefore : outcome.fullStatsBefore,
        fullStats       : outcome.fullStats
      };

      if (searchQuery &&
          !sim.playerName.toLowerCase().includes(searchQuery.toLowerCase())) {
        continue;
      }

      if (matched++ < skip) continue;
      results.push(sim);
      if (results.length >= limit) return results;
    }

    if (results.length >= limit) break;
  }

  return results;
}

/* -------------------------------------------------------------------------- */
/*  DFS CON PRUNING + MEMO                                                    */
/* -------------------------------------------------------------------------- */

type FaceSnapshot = readonly [
  number,number,number,number,number,number,number,number
];
type MemoKey = string;

function findEvoSequencesDFS(
  player: Player,
  evos  : Evolution[],
  need  : number
): Evolution[][] {

  /* ----- stato radice ---------------------------------------------------- */
  const root: NodeState = (() => {
    const raw = player['play style']
      ? player['play style'].split(',').map(p => p.trim()).filter(Boolean)
      : [];
    const plus  = new Set(raw.filter(p => p.endsWith('+')).map(p => p.slice(0,-1)));
    const plain = new Set(raw.filter(p => !p.endsWith('+')).filter(p => !plus.has(p)));
    return {
      stats   : buildInitialStats(player),
      plainPS : plain.size,
      plusPS  : plus.size,
      roles   : new Set([player.Position, ...player.alternativePositions]),
      rarity  : '',
      deadline: new Date('9999‑12‑31')
    };
  })();

  const snap = (s:Stats):FaceSnapshot=>[
    s.ovr,s.pac,s.sho,s.pas,s.dri,s.def,s.phy,
    s.skillMoves*10+s.weakFoot
  ];
  const mkKey = (mask:number,s:FaceSnapshot):MemoKey=> mask+':'+s.join(',');

  const memo   = new Map<MemoKey,true>();
  const output : Evolution[][] = [];

  interface Frame{ state:NodeState; remaining:Evolution[]; bitmask:number; chosen:Evolution[] }
  const stack:Frame[]=[{state:root,remaining:evos,bitmask:0,chosen:[]}];

  while(stack.length && output.length<need){
    const {state,remaining,bitmask,chosen}=stack.pop()!;

    if(!remaining.length){
      output.push(chosen);
      continue;
    }

    for(let i=0;i<remaining.length;i++){
      const evo = remaining[i];
      const rest= remaining.filter((_,j)=>j!==i);
      const mask= bitmask | (1<<i);

      const next= applyEvoShallow(state,evo);
      if(!next) continue;

      const key = mkKey(mask,snap(next.stats));
      if(memo.has(key)) continue;
      if(memo.size>MEMO_LIMIT) memo.clear();
      memo.set(key,true);

      stack.push({state:next,remaining:rest,bitmask:mask,chosen:[...chosen,evo]});
    }
  }

  return output.slice(0,need);
}

/* -------------------------------------------------------------------------- */
/*  APPLY‑EVO SHALLOW                                                        */
/* -------------------------------------------------------------------------- */

function applyEvoShallow(prev: NodeState, evo: Evolution): NodeState | null {

  const st: NodeState = {
    stats   : { ...prev.stats },
    plainPS : prev.plainPS,
    plusPS  : prev.plusPS,
    roles   : new Set(prev.roles),
    rarity  : prev.rarity,
    deadline: prev.deadline
  };

  const map: Record<string,keyof Stats> = {
    Overall:'ovr', Pace:'pac', Shooting:'sho', Dribbling:'dri',
    Defending:'def', Physicality:'phy', Passing:'pas',
    'Skill Moves':'skillMoves', 'Weak Foot':'weakFoot'
  };

  /* req generali ---------------------------------------------------------- */
  for(const k in evo.requirements){
    const req=evo.requirements[k]!;
    if(map[k]){
      const {type,value}=parseRequirement(req)!;
      const v=st.stats[map[k]];
      if((type==='max'&&v>value)||(type==='min'&&v<value)) return null;
    }else if(k==='Position'&&!st.roles.has(req)) return null;
      else if(k==='Rarity'&&st.rarity!==req)     return null;
  }

  /* cap PS ---------------------------------------------------------------- */
  const capPlus=evo.requirements['Max PS+']?+evo.requirements['Max PS+']:Infinity;
  const capBase=evo.requirements['Max PS' ]?+evo.requirements['Max PS' ]:Infinity;
  if(st.plusPS>capPlus || st.plainPS>capBase) return null;

  /* deadline & pos -------------------------------------------------------- */
  const d=new Date(evo.expires_on);
  if(d<st.deadline) st.deadline=d;
  evo.new_positions.forEach(p=>st.roles.add(p));

  /* upgrades -------------------------------------------------------------- */
  for(const up of evo.upgrades) for(const line of up.description){
    const p=parseUpgradeLine(line);

    if(p.type==='stat'&&p.key&&p.delta!=null){
      const sk=statKeyMapping(p.key);
      if(!sk) continue;
      st.stats[sk]=Math.min(st.stats[sk]+p.delta,p.cap??FACE_STAT_MAX);
      continue;
    }
    if(p.type==='playstyle'&&p.key){
      if(st.plainPS<capBase) st.plainPS++;
      continue;
    }
    if(p.type==='playstylePlus'&&p.key){
      if(st.plusPS<capPlus){ st.plusPS++; if(st.plainPS) st.plainPS--; }
      continue;
    }
    if(p.type==='rarity'&&p.text){ st.rarity=p.text; }
  }

  /* static PS ------------------------------------------------------------- */
  st.plainPS+=evo.playstyles_added.length;
  st.plusPS +=evo.playstyles_plus_added.length;
  if(st.plusPS>capPlus || st.plainPS>capBase) return null;

  return st;
}

/* -------------------------------------------------------------------------- */
/*  SIMULAZIONE COMPLETA (codice originale)                                   */
/* -------------------------------------------------------------------------- */

interface SimulationOutcome{
  success:boolean; finalStats:Stats; playstyles:string[];
  playstylesPlus:string[]; roles:string[]; deadline:Date;
  fullStatsBefore:Record<string,number>; fullStats:Record<string,number>;
}

function simulateEvoSequence(player:Player,seq:Evolution[]):SimulationOutcome{
  /* === codice originale invariato, solo check sk === */
  const currentStats:Stats = {
    ovr:player.OVR,pac:player.PAC,sho:player.SHO,pas:player.PAS,
    dri:player.DRI,def:player.DEF,phy:player.PHY,
    skillMoves:player.skillMoves,weakFoot:player.weakFoot
  };

  const advancedStats   ={...(player.fullStats||{})};
  const fullStatsBefore ={...advancedStats};

  const advancedGroups:Record<string,string[]>={
    Pace:['Acceleration','Sprint Speed'],
    Shooting:['Positioning','Finishing','Shot Power','Long Shots','Volleys','Penalties'],
    Passing:['Vision','Crossing','Free Kick Accuracy','Short Passing','Long Passing','Curve'],
    Dribbling:['Agility','Balance','Reactions','Ball Control','Dribbling','Composure'],
    Defending:['Interceptions','Heading Accuracy','Def Awareness','Standing Tackle','Sliding Tackle'],
    Physicality:['Jumping','Stamina','Strength','Aggression']
  };

  const updateAdv=(k:string,d:number,cap?:number)=>{
    const capV=cap??FACE_STAT_MAX;
    const old=advancedStats[k]??0;
    advancedStats[k]=Math.min(capV,Math.max(old,old+d));
  };

  const rawPS = player['play style']?player['play style'].split(',').map(s=>s.trim()):[];
  const plusSet=new Set(rawPS.filter(p=>p.endsWith('+')).map(p=>p.slice(0,-1)));
  const plainSet=new Set(rawPS.filter(p=>!p.endsWith('+')).filter(p=>!plusSet.has(p)));

  let rarity=''; const roles=new Set<string>([player.Position,...player.alternativePositions]);
  let deadline=new Date('9999‑12‑31');

  const statMap:Record<string,keyof Stats>={
    Overall:'ovr',Pace:'pac',Shooting:'sho',Dribbling:'dri',
    Defending:'def',Physicality:'phy',Passing:'pas',
    'Skill Moves':'skillMoves','Weak Foot':'weakFoot'
  };

  for(const evo of seq){
    for(const k in evo.requirements){
      const req=evo.requirements[k]!;
      if(statMap[k]){
        const {type,value}=parseRequirement(req)!;
        const v=currentStats[statMap[k]];
        if((type==='max'&&v>value)||(type==='min'&&v<value)) return fail();
      }else if(k==='Position'&&!roles.has(req)) return fail();
        else if(k==='Rarity'&&rarity!==req)      return fail();
    }

    const capPlus=evo.requirements['Max PS+']?+evo.requirements['Max PS+']:Infinity;
    const capBase=evo.requirements['Max PS'] ?+evo.requirements['Max PS'] :Infinity;
    if(plusSet.size>capPlus||plainSet.size>capBase) return fail();

    const d=new Date(evo.expires_on);
    if(d<deadline) deadline=d;
    evo.new_positions.forEach(p=>roles.add(p));

    for(const up of evo.upgrades) for(const line of up.description){
      const p=parseUpgradeLine(line);

      if(p.type==='stat'&&p.key&&p.delta!=null){
        const sk=statKeyMapping(p.key);
        if(!sk) continue;
        const old=currentStats[sk];
        currentStats[sk]=Math.min(old+p.delta,p.cap??FACE_STAT_MAX);
        const applied=currentStats[sk]-old;
        updateAdv(p.key,applied,p.cap);
        const subs=advancedGroups[p.key]; if(subs)subs.forEach(s=>updateAdv(s,applied));
        continue;
      }
      if(p.type==='playstyle'&&p.key){
        if(!plusSet.has(p.key)&&plainSet.size<capBase) plainSet.add(p.key);
        continue;
      }
      if(p.type==='playstylePlus'&&p.key){
        if(plusSet.size<capPlus){ plusSet.add(p.key); plainSet.delete(p.key);}
        continue;
      }
      switch(p.type){
        case 'rarity': if(p.text) rarity=p.text; break;
        case 'newPos':
        case 'role':
        case 'rolePlus': if(p.key) roles.add(p.key); break;
      }
    }

    evo.playstyles_added.forEach(ps=>{
      if(!plusSet.has(ps)&&plainSet.size<capBase) plainSet.add(ps);
    });
    evo.playstyles_plus_added.forEach(ps=>{
      if(plusSet.size<capPlus){ plusSet.add(ps); plainSet.delete(ps);}
    });
  }

  return ok();
  function ok():SimulationOutcome{
    return{
      success:true,
      finalStats:{...currentStats},
      playstyles:Array.from(plainSet),
      playstylesPlus:Array.from(plusSet),
      roles:Array.from(roles),
      deadline,
      fullStatsBefore,
      fullStats:advancedStats
    };
  }
  function fail():SimulationOutcome{ return {...ok(),success:false}; }
}

/* -------------------------------------------------------------------------- */
/*  UTILITY                                                                  */
/* -------------------------------------------------------------------------- */

function buildInitialStats(p:Player):Stats{
  return{ovr:p.OVR,pac:p.PAC,sho:p.SHO,pas:p.PAS,dri:p.DRI,def:p.DEF,phy:p.PHY,
         skillMoves:p.skillMoves,weakFoot:p.weakFoot};
}

function statKeyMapping(k:string):keyof Stats|undefined{
  return ({
    Overall:'ovr',Pace:'pac',Shooting:'sho',Dribbling:'dri',
    Defending:'def',Physicality:'phy',Passing:'pas',
    'Skill Moves':'skillMoves','Weak Foot':'weakFoot',
    SM:'skillMoves',WF:'weakFoot'
  } as Record<string,keyof Stats|undefined>)[k];
}

function parseRequirement(req:string){
  const m=req.match(/^(Max\.?|Min\.?)\s*(\d+)$/i);
  if(!m) return null;
  return{type:m[1].toLowerCase().startsWith('max')?'max':'min',value:+m[2]};
}

interface ParsedUpgrade{
  type:'stat'|'playstyle'|'playstylePlus'|'newPos'|'role'|'rolePlus'|'rarity'|'unknown';
  key?:string; delta?:number; cap?:number; text?:string;
}

function parseUpgradeLine(line:string):ParsedUpgrade{
  const l=line.trim();
  if(l.startsWith('Rarity')) return{type:'rarity',text:l.slice('Rarity'.length).trim()};
  if(/^PlayStyle\+/.test(l)){
    const m=l.match(/^PlayStyle\+\s*([^(]+)(?:\(\^(\d+)\))?/)!;
    return{type:'playstylePlus',key:m[1].trim(),cap:m[2]?+m[2]:undefined};
  }
  if(/^PlayStyle/.test(l)){
    const m=l.match(/^PlayStyle\s*([^(]+)(?:\(\^(\d+)\))?/)!;
    return{type:'playstyle',key:m[1].trim(),cap:m[2]?+m[2]:undefined};
  }
  if(/^New Pos\./.test(l)){
    const m=l.match(/^New Pos\.\s*([^(]+)(?:\(\^(\d+)\))?/)!;
    return{type:'newPos',key:m[1].trim(),cap:m[2]?+m[2]:undefined};
  }
  if(/^Role\+\+/.test(l)){
    const m=l.match(/^Role\+\+\s*([^(]+)(?:\(\^(\d+)\))?/)!;
    return{type:'rolePlus',key:m[1].trim(),cap:m[2]?+m[2]:undefined};
  }
  const stat=/^([\w\.\s]+)\s*([+\-]\d+)\s*(?:★)?\s*(?:\(\^(\d+)\))?/;
  const sm=l.match(stat);
  if(sm){
    let key=sm[1].trim();
    const norm:Record<string,string>={
      'Att. Position':'Positioning','Heading Acc.':'Heading Accuracy',
      'Def. Aware':'Def Awareness','FK. Acc.':'Free Kick Accuracy',
      'Short Pass':'Short Passing','Long Pass':'Long Passing',
      'Slide Tackle':'Sliding Tackle','Stand Tackle':'Standing Tackle'
    };
    if(norm[key]) key=norm[key];
    return{type:'stat',key,delta:+sm[2],cap:sm[3]?+sm[3]:undefined};
  }
  return{type:'unknown',text:l};
}

function calculateCustomScore(face:Stats,full:Record<string,number>){
  const sumFace=face.pac+face.sho+face.pas+face.dri+face.def+face.phy;
  const avgFace=sumFace/6;
  const advKeys=[
    'Acceleration','Sprint Speed','Positioning','Finishing','Shot Power','Long Shots',
    'Volleys','Penalties','Vision','Crossing','Free Kick Accuracy','Short Passing',
    'Long Passing','Curve','Dribbling','Agility','Balance','Reactions','Ball Control',
    'Composure','Interceptions','Heading Accuracy','Def Awareness','Standing Tackle',
    'Sliding Tackle','Jumping','Stamina','Strength','Aggression'
  ];
  let sumAdv=0,cnt=0;
  advKeys.forEach(k=>{ if(full[k]!=null){ sumAdv+=full[k]; cnt++; } });
  const avgAdv=cnt?sumAdv/cnt:0;
  return 0.2*face.ovr + 0.5*avgFace + 0.3*avgAdv;
}

/* -------------------------------------------------------------------------- */
/*  CSV PARSING & CACHING                                                     */
/* -------------------------------------------------------------------------- */

let _playersCache:Player[]|null=null;
async function cachedPlayers():Promise<Player[]>{
  if(_playersCache) return _playersCache;
  const res=await fetch('/data/players.csv');
  const txt=await res.text();
  _playersCache=parseCSV(txt);
  return _playersCache;
}

function splitCSVLine(line:string){
  const res:string[]=[]; let cur=''; let inQ=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i],nx=line[i+1];
    if(inQ&&ch=='"'&&nx=='"'){cur+='"';i++;continue;}
    if(ch=='"'){inQ=!inQ;continue;}
    if(ch==','&&!inQ){res.push(cur);cur='';} else cur+=ch;
  }
  res.push(cur); return res.map(s=>s.trim());
}

function parseCSV(txt:string):Player[]{
  const lines=txt.split('\n').filter(l=>l.trim());
  const hdr=splitCSVLine(lines[0]);
  const numeric=[
    'OVR','PAC','SHO','PAS','DRI','DEF','PHY',
    'Acceleration','Sprint Speed','Positioning','Finishing','Shot Power','Long Shots',
    'Volleys','Penalties','Vision','Crossing','Free Kick Accuracy','Short Passing',
    'Long Passing','Curve','Dribbling','Agility','Balance','Reactions','Ball Control',
    'Composure','Interceptions','Heading Accuracy','Def Awareness','Standing Tackle',
    'Sliding Tackle','Jumping','Stamina','Strength','Aggression',
    'Skill moves','Weak foot'
  ];
  const players:Player[]=[];
  for(let i=1;i<lines.length;i++){
    const vals=splitCSVLine(lines[i]);
    const obj:any={};
    hdr.forEach((h,j)=>obj[h]=vals[j]??'');
    numeric.forEach(c=>{ if(obj[c]!=='') obj[c]=+obj[c]; });
    obj.alternativePositions=obj['Alternative positions']
      ?obj['Alternative positions']
          .split(obj['Alternative positions'].includes(';')?';':',')
          .map((s:string)=>s.trim())
      :[];
    obj.Position ||= '';
    obj.skillMoves = +obj['Skill moves'];
    obj.weakFoot   = +obj['Weak foot'];
    obj.fullStats  = {};
    numeric.forEach(c=>{ if(obj[c]!=null) obj.fullStats[c]=obj[c]; });
    players.push(obj as Player);
  }
  return players;
}
