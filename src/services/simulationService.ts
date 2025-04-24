// src/services/simulationService.ts
// Ottimizzato 2025-04-23 – supporto posizioni multiple, controllo "Max Pos.", bug-fix requisiti statistiche
// + debug console.log sui primi due giocatori per verifica requisiti

/* -------------------------------------------------------------------------- */
/*  TIPI E COSTANTI                                                           */
/* -------------------------------------------------------------------------- */

export interface Stats {
  ovr: number;
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
  skillMoves: number;
  weakFoot: number;
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
  fullStatsBefore: Record<string, number>;
  fullStats: Record<string, number>;
}

export interface Evolution {
  id: string;
  name: string;
  unlock_date: string;
  expires_on: string;
  cost: string;
  requirements: Record<string, string>;
  total_upgrades?: Record<string, string>;
  challenges: string[];
  upgrades: { step: number; description: string[]; effects: Record<string, number> }[];
  new_positions: string[];
  playstyles_added: string[];
  playstyles_plus_added: string[];
  final_bonus: Record<string, string> | {};
  url: string;
}

export interface Player {
  id: number;
  Name: string;
  OVR: number;
  PAC: number;
  SHO: number;
  PAS: number;
  DRI: number;
  DEF: number;
  PHY: number;
  Position: string;
  alternativePositions: string[];
  'play style': string;
  weakFoot: number;
  skillMoves: number;
  fullStats?: Record<string, number>;
}

interface NodeState {
  stats: Stats;
  plainPS: number;
  plusPS: number;
  roles: Set<string>;
  rarity: string;
  deadline: Date;
}

interface ParsedUpgrade {
  type:
    | 'stat'
    | 'playstyle'
    | 'playstylePlus'
    | 'newPos'
    | 'role'
    | 'rolePlus'
    | 'rarity'
    | 'unknown';
  key?: string;
  delta?: number;
  cap?: number;
  text?: string;
}

interface PreparedEvolution extends Evolution {
  reqs: { key: string; type: 'min' | 'max'; value: number }[];
  capBase: number;
  capPlus: number;
  upgradesParsed: ParsedUpgrade[];
}

interface SimulationOutcome {
  success: boolean;
  finalStats: Stats;
  playstyles: string[];
  playstylesPlus: string[];
  roles: string[];
  deadline: Date;
  fullStatsBefore: Record<string, number>;
  fullStats: Record<string, number>;
}

const FACE_STAT_MAX = 99;
const SKILL_WF_MAX = 5;
const MEMO_LIMIT = 10_000;

/** 
 * Restituisce il cap effettivo per un upgrade: 
 * - se esplicitato, usalo 
 * - altrimenti 5 per Skill Moves / Weak Foot, 99 per tutte le altre 
 */
function getUpgradeCap(statKey: string, explicitCap?: number): number {
  if (explicitCap != null) return explicitCap;
  const key = statKey.toLowerCase();
  if (key === 'skill moves' || key === 'skillmoves' || key === 'weak foot' || key === 'weakfoot') {
    return SKILL_WF_MAX;
  }
  return FACE_STAT_MAX;
}

/* -------------------------------------------------------------------------- */
/*  FUNZIONE PRINCIPALE                                                       */
/* -------------------------------------------------------------------------- */

export async function runSimulationPage(
  selectedEvos: Evolution[],
  skip: number,
  limit: number,
  searchQuery = ''
): Promise<SimulationResult[]> {

  const players = await cachedPlayers();
  const today   = new Date();

  const queryNorm = searchQuery.trim().toLowerCase();   // ✔ trim

  console.log(`[Simulation] Running: skip=${skip}, limit=${limit}, query="${queryNorm}"`);

  const validEvos = selectedEvos.filter(e => new Date(e.expires_on) >= today);
  if (!validEvos.length) {
    console.log('[Simulation] Nessuna evoluzione valida, risultato vuoto.');
    return [];
  }

  const evosPrep = prepareEvos(validEvos);
  const allSims: SimulationResult[] = [];

  for (let pi = 0; pi < players.length; pi++) {
    const player = players[pi];
    const debug  = pi < 20;
    if (debug) console.log(`\n[Sim][Player ${pi + 1}] "${player.Name}"`);

    const sequences = findEvoSequencesDFS(player, evosPrep, Infinity, debug);
    if (debug) console.log(`[Sim][${player.Name}] sequences: ${sequences.length}`);

    for (const seq of sequences) {
      if (seq.length !== evosPrep.length) {
        if (debug) console.log(`  Skipping seq (${seq.length}/${evosPrep.length})`);
        continue;
      }
      const outcome = simulateEvoSequence(player, seq);
      if (debug) console.log(`  Outcome success=${outcome.success}`);
      if (!outcome.success) continue;

      const sim: SimulationResult = {
        playerName: player.Name,
        initialStats: buildInitialStats(player),
        score: calculateCustomScore(outcome.finalStats, outcome.fullStats),
        evolutionOrder: seq.map(e => e.name),
        playstyles: outcome.playstyles,
        playstylesPlus: outcome.playstylesPlus,
        roles: outcome.roles,
        finalStats: outcome.finalStats,
        deadline: outcome.deadline,
        fullStatsBefore: outcome.fullStatsBefore,
        fullStats: outcome.fullStats,
      };

      if (debug) {
        console.log('  FinalStats:', sim.finalStats);
        console.log(`  Score: ${sim.score.toFixed(2)}`);
      }

      /* --------- filtro query normalizzata --------- */
      if (queryNorm && !sim.playerName.toLowerCase().includes(queryNorm)) {
        if (debug) console.log('  Filtered by query');
        continue;
      }

      allSims.push(sim);
      if (allSims.length >= skip + limit) {
        console.log(`[Simulation] Raggiunti ${allSims.length} risultati, interrompo scansione.`);
        break;
      }
    }
    if (allSims.length >= skip + limit) break;
  }

  const results = allSims.slice(skip, skip + limit);

  console.log(`[Simulation] Restituisco ${results.length} risultati (prima ${skip + 1}…${skip + limit})`);
  return results;
}
/* -------------------------------------------------------------------------- */
/*  PRE-PROCESS EVOLUZIONI                                                    */
/* -------------------------------------------------------------------------- */

function prepareEvos(evos: Evolution[]): PreparedEvolution[] {
  return evos.map((evo) => {
    const reqs: PreparedEvolution['reqs'] = [];
    let capBase = Infinity;
    let capPlus = Infinity;

    for (const key in evo.requirements) {
      const raw = evo.requirements[key]!;
      if (key === 'Max PS') capBase = +raw;
      if (key === 'Max PS+') capPlus = +raw;
      const pr = parseRequirement(raw);
      if (pr) reqs.push({ key, type: pr.type, value: pr.value });
    }

    const upgradesParsed: ParsedUpgrade[] = [];
    for (const up of evo.upgrades) {
      for (const line of up.description) {
        upgradesParsed.push(parseUpgradeLine(line));
      }
    }

    return { ...evo, reqs, capBase, capPlus, upgradesParsed };
  });
}

/* -------------------------------------------------------------------------- */
/*  DFS + PRUNING + MEMO LRU                                                  */
/* -------------------------------------------------------------------------- */

function findEvoSequencesDFS(
  player: Player,
  evos: PreparedEvolution[],
  need: number,
  debug = false
): PreparedEvolution[][] {
  const root: NodeState = (() => {
    const rawPS = player['play style'] ? player['play style'].split(',').map((p) => p.trim()) : [];
    const plus = new Set(
      rawPS
        .filter((p) => p.endsWith('+') || /\(\+\)/.test(p))
        .map((p) => p.replace(/[+()]/g, '').trim())
    );
    const plain = new Set(rawPS.filter((p) => !plus.has(p.replace(/[+()]/g, '').trim())));

    const initPos = player.Position.split(/[\/;,]/).map((s) => s.trim());
    const roles = new Set<string>([...initPos, ...player.alternativePositions]);

    return {
      stats: buildInitialStats(player),
      plainPS: plain.size,
      plusPS: plus.size,
      roles,
      rarity: '',
      deadline: new Date('9999-12-31'),
    };
  })();

  const statKeys = new Set([
    'Overall',
    'Pace',
    'Shooting',
    'Dribbling',
    'Defending',
    'Physicality',
    'Passing',
    'Skill Moves',
    'Weak Foot',
  ]);

  const snap = (s: Stats, pl: number, pp: number): string =>
    [s.ovr, s.pac, s.sho, s.pas, s.dri, s.def, s.phy, s.skillMoves, s.weakFoot, pl, pp].join(',');

  const memo = new Map<string, true>();
  const results: PreparedEvolution[][] = [];
  const used = new Array(evos.length).fill(false);

  function dfs(state: NodeState, chosen: PreparedEvolution[], mask: number) {
    if (results.length >= need) return;
    let found = false;

    for (let i = 0; i < evos.length; i++) {
      if (used[i]) continue;
      const evo = evos[i];

      // Verifica requisiti
      let ok = true;
      for (const reqKey of Object.keys(evo.requirements)) {
        const raw = evo.requirements[reqKey]!;
        if (statKeys.has(reqKey)) {
          const sk = statKeyMapping(reqKey)!;
          const v = state.stats[sk];
          const { type, value } = parseRequirement(raw)!;
          if ((type === 'min' && v < value) || (type === 'max' && v > value)) { ok = false; break; }
        } else if (reqKey === 'Position') {
          const wanted = raw.split(/[,/;]/).map((p) => p.trim().toUpperCase());
          if (!wanted.some((pos) => state.roles.has(pos))) { ok = false; break; }
        } else if (reqKey === 'Max Pos.') {
          if (state.roles.size > +raw) { ok = false; break; }
        } else if (reqKey === 'Rarity') {
          if (state.rarity !== raw) { ok = false; break; }
        }
      }
      if (!ok) continue;

      found = true;

      // Controllo playstyle caps
      if (state.plainPS > evo.capBase || state.plusPS > evo.capPlus) continue;

      // Costruisco next state
      const next: NodeState = {
        stats: { ...state.stats },
        plainPS: state.plainPS,
        plusPS: state.plusPS,
        roles: new Set(state.roles),
        rarity: state.rarity,
        deadline: state.deadline,
      };

      // Deadline e nuove posizioni
      const exp = new Date(evo.expires_on);
      if (exp < next.deadline) next.deadline = exp;
      evo.new_positions.forEach((p) => next.roles.add(p.toUpperCase()));

      // Applica upgrades parsati
      for (const pu of evo.upgradesParsed) {
        if (pu.type === 'stat' && pu.key && pu.delta != null) {
          const sk2 = statKeyMapping(pu.key);
          if (sk2) {
            const old = next.stats[sk2];
            const capValue = getUpgradeCap(pu.key, pu.cap);
            const applied = Math.min(pu.delta, Math.max(0, capValue - old));
            if (applied) next.stats[sk2] = old + applied;
          }
        } else if (pu.type === 'playstyle' && pu.key) {
          if (next.plainPS < evo.capBase) next.plainPS++;
        } else if (pu.type === 'playstylePlus' && pu.key) {
          if (next.plusPS < evo.capPlus) {
            next.plusPS++;
            if (next.plainPS) next.plainPS--;
          }
        } else if (pu.type === 'rarity' && pu.text) {
          next.rarity = pu.text;
        } else if ((pu.type === 'newPos' || pu.type === 'role' || pu.type === 'rolePlus') && pu.key) {
          next.roles.add(pu.key.toUpperCase());
        }
      }

      // Playstyles_added / plus
      evo.playstyles_added.forEach((ps) => {
        if (next.plainPS < evo.capBase) next.plainPS++;
      });
      evo.playstyles_plus_added.forEach((ps) => {
        if (next.plusPS < evo.capPlus) {
          next.plusPS++;
          if (next.plainPS) next.plainPS--;
        }
      });

      const key = mask + (1 << i) + ':' + snap(next.stats, next.plainPS, next.plusPS);
      if (!memo.has(key)) {
        if (memo.size > MEMO_LIMIT) memo.clear();
        memo.set(key, true);

        used[i] = true;
        dfs(next, chosen.concat(evo), mask | (1 << i));
        used[i] = false;
        if (results.length >= need) return;
      }
    }

    if (!found) {
      results.push(chosen.slice());
    }
  }

  dfs(root, [], 0);
  return results.slice(0, need);
}

/* -------------------------------------------------------------------------- */
/*  SIMULAZIONE COMPLETA                                                      */
/* -------------------------------------------------------------------------- */

function simulateEvoSequence(
  player: Player,
  seq: PreparedEvolution[],
): SimulationOutcome {

  /* ------------------------------------------------------------------ */
  /*  1.  Setup iniziale                                                */
  /* ------------------------------------------------------------------ */
  const initialFace     = buildInitialStats(player);           // facestats di partenza
  const face: Stats     = { ...initialFace };

  const advancedStats   = { ...(player.fullStats || {}) };     // tutte le sub-stats
  const fullStatsBefore = { ...advancedStats };

  /* -------- gruppi di sub-stats per ogni face -------- */
  const advancedGroups: Record<keyof Stats, string[]> = {
    ovr: [],
    pac: ['Acceleration', 'Sprint Speed'],
    sho: ['Positioning', 'Finishing', 'Shot Power', 'Long Shots', 'Volleys', 'Penalties'],
    pas: ['Vision', 'Crossing', 'Free Kick Accuracy', 'Short Passing', 'Long Passing', 'Curve'],
    dri: ['Agility', 'Balance', 'Reactions', 'Ball Control', 'Dribbling', 'Composure'],
    def: ['Interceptions', 'Heading Accuracy', 'Def Awareness', 'Standing Tackle', 'Sliding Tackle'],
    phy: ['Jumping', 'Stamina', 'Strength', 'Aggression'],
    skillMoves: [],
    weakFoot:  [],
  };

  /* -------- mapping “testo → chiave Stats” -------- */
  const statMap: Record<string, keyof Stats> = {
    Overall: 'ovr', Pace: 'pac', Shooting: 'sho', Dribbling: 'dri',
    Defending: 'def', Physicality: 'phy', Passing: 'pas',
    'Skill Moves': 'skillMoves', 'Weak Foot': 'weakFoot',
    SM: 'skillMoves', WF: 'weakFoot',
  };

  /* ------------------------------------------------------------------ */
  /*  2.  Variabili runtime                                             */
  /* ------------------------------------------------------------------ */
  let rarity   = '';
  const roles  = new Set<string>([
    ...player.Position.split(/[\/;,]/).map(s => s.trim().toUpperCase()),
    ...player.alternativePositions.map(p => p.toUpperCase()),
  ]);
  let deadline = new Date('9999-12-31');

  /* --- playstyles (set base / plus) --- */
  const rawPS    = player['play style']
                    ? player['play style'].split(',').map(s => s.trim())
                    : [];
  const plusSet  = new Set(rawPS.filter(p => p.endsWith('+')).map(p => p.slice(0, -1)));
  const plainSet = new Set(
    rawPS.filter(p => !p.endsWith('+')).filter(p => !plusSet.has(p)),
  );

  /* --- tracker per la logica “media-1” e propagazione --------------- */
  const faceUpgraded: Record<keyof Stats, boolean> =
    Object.fromEntries((Object.keys(initialFace) as (keyof Stats)[])
      .map(k => [k, false])) as any;

  const groupAdvDelta: Record<keyof Stats, number> =
    Object.fromEntries((Object.keys(initialFace) as (keyof Stats)[])
      .map(k => [k, 0])) as any;

  const explicitAdv = new Set<string>();   // sub-stats toccate direttamente

  /* ------------------------------------------------------------------ */
  /*  3.  Loop evoluzioni                                               */
  /* ------------------------------------------------------------------ */
  for (const evo of seq) {

    /* ---------- 3.1  Requisiti di accesso ---------- */
    for (const reqKey of Object.keys(evo.requirements)) {
      const raw = evo.requirements[reqKey]!;
      const statKeys = [
        'Overall','Pace','Shooting','Dribbling','Defending',
        'Physicality','Passing','Skill Moves','Weak Foot',
      ];

      if (statKeys.includes(reqKey)) {
        const sk            = statMap[reqKey]!;
        const currentValue  = face[sk];
        const { type, value } = parseRequirement(raw)!;
        if ((type === 'min' && currentValue < value) ||
            (type === 'max' && currentValue > value)) return fail();
      } else if (reqKey === 'Position') {
        const wanted = raw.split(/[,/;]/).map(p => p.trim().toUpperCase());
        if (!wanted.some(p => roles.has(p))) return fail();
      } else if (reqKey === 'Max Pos.') {
        if (roles.size > +raw) return fail();
      } else if (reqKey === 'Rarity') {
        if (rarity !== raw) return fail();
      }
    }

    /* ---------- 3.2  Rispetto cap PS / PS+ ---------- */
    if (plainSet.size > evo.capBase || plusSet.size > evo.capPlus) return fail();

    /* ---------- 3.3  Deadline e nuove posizioni ------ */
    const exp = new Date(evo.expires_on);
    if (exp < deadline) deadline = exp;
    evo.new_positions.forEach(p => roles.add(p.toUpperCase()));

    /* ---------- 3.4  Applicazione upgrade ----------- */
    for (const up of evo.upgrades) {
      for (const line of up.description) {
        const pu = parseUpgradeLine(line);

        /* ---- (a) Face-stat ******************************************************** */
        if (pu.type === 'stat' && pu.key && statMap[pu.key] && pu.delta != null) {
          const sk       = statMap[pu.key]!;
          const oldFace  = face[sk];
          const capFace  = getUpgradeCap(pu.key, pu.cap);
          const applied  = Math.min(pu.delta, Math.max(0, capFace - oldFace));
          if (applied) {
            face[sk]                 = oldFace + applied;
            advancedStats[pu.key]    = face[sk];   // aggiorna la riga “Pace”, “Passing”, …
            faceUpgraded[sk]         = true;
          }
          continue;
        }

        /* ---- (b) Sub-stat ********************************************************** */
        if (pu.type === 'stat' && pu.key && pu.delta != null) {
          const advKey  = pu.key;
          const oldAdv  = advancedStats[advKey] ?? 0;
          const capAdv  = getUpgradeCap(advKey, pu.cap);
          const applied = Math.min(pu.delta, Math.max(0, capAdv - oldAdv));
          if (applied === 0) continue;

          advancedStats[advKey] = oldAdv + applied;
          explicitAdv.add(advKey);

          /* accumulo per la media di gruppo */
          for (const g of Object.keys(advancedGroups) as (keyof Stats)[]) {
            if (advancedGroups[g].includes(advKey)) {
              groupAdvDelta[g] += applied;
              break;
            }
          }
          continue;
        }

        /* ---- (c) PlayStyle base / plus (priorità +) -------------------------------- */
        if (pu.type === 'playstyle' && pu.key) {
          if (!plusSet.has(pu.key) && plainSet.size < evo.capBase) {
            plainSet.add(pu.key);
          }
        }
        if (pu.type === 'playstylePlus' && pu.key) {
          if (plusSet.size < evo.capPlus) {
            plusSet.add(pu.key);
            plainSet.delete(pu.key);             // rimuove la versione base se presente
          }
        }

        /* ---- (d) Rarity / Ruoli ----------------------------------------------------- */
        if (pu.type === 'rarity' && pu.text) {
          rarity = pu.text;
        }
        if ((pu.type === 'newPos' || pu.type === 'role' || pu.type === 'rolePlus') && pu.key) {
          roles.add(pu.key.toUpperCase());
        }
      }
    }

    /* ---------- 3.5  Playstyles added nei campi JSON ---------- */
    evo.playstyles_added.forEach(ps => {
      if (!plusSet.has(ps) && plainSet.size < evo.capBase) plainSet.add(ps);
    });
    evo.playstyles_plus_added.forEach(ps => {
      if (plusSet.size < evo.capPlus) {
        plusSet.add(ps);
        plainSet.delete(ps);
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /*  4.  Media-1 (face non potenziata direttamente)                    */
  /* ------------------------------------------------------------------ */
  for (const g of Object.keys(advancedGroups) as (keyof Stats)[]) {
    if (faceUpgraded[g]) continue;               // già aumentata in modo esplicito
    if (!groupAdvDelta[g]) continue;             // nessun delta sulle sub-stats

    const divisor = advancedGroups[g].length || 1;
    const avg     = Math.round(groupAdvDelta[g] / divisor);
    const incFace = Math.max(0, avg - 1);        // regola “media − 1”

    if (incFace) {
      face[g] = Math.min(FACE_STAT_MAX, face[g] + incFace);
      advancedStats[faceKeyToString(g)] = face[g];
    }
  }

  /* ------------------------------------------------------------------ */
  /*  5.  Propagazione Δ face → sub-stats (se face è salita)            */
  /*      (+7 su tutti i sub, tranne quelli con upgrade esplicito)      */
  /* ------------------------------------------------------------------ */
  for (const g of Object.keys(advancedGroups) as (keyof Stats)[]) {
    const deltaFace = face[g] - initialFace[g];
    if (deltaFace <= 0) continue;

    for (const sub of advancedGroups[g]) {
      if (explicitAdv.has(sub)) continue;        // preserva le sub-stats già toccate
      advancedStats[sub] = Math.min(
        FACE_STAT_MAX,
        (fullStatsBefore[sub] ?? 0) + deltaFace,
      );
    }
  }

  /* ------------------------------------------------------------------ */
  /*  6.  Risultato finale                                              */
  /* ------------------------------------------------------------------ */
  return ok();

  /* ============================ helpers ============================= */
  function ok(): SimulationOutcome {
    return {
      success: true,
      finalStats: { ...face },
      playstyles: Array.from(plainSet),
      playstylesPlus: Array.from(plusSet),
      roles: Array.from(roles),
      deadline,
      fullStatsBefore,
      fullStats: advancedStats,
    };
  }

  function fail(): SimulationOutcome {
    return { ...ok(), success: false };
  }

  function faceKeyToString(k: keyof Stats): string {
    const rev: Record<keyof Stats, string> = {
      ovr:'Overall', pac:'Pace', sho:'Shooting', pas:'Passing',
      dri:'Dribbling', def:'Defending', phy:'Physicality',
      skillMoves:'Skill Moves', weakFoot:'Weak Foot',
    };
    return rev[k];
  }
}


/* -------------------------------------------------------------------------- */
/*  CALCOLO SCORE                                                             */
/* -------------------------------------------------------------------------- */

function calculateCustomScore(face: Stats, full: Record<string, number>): number {
  const sumFace = face.pac + face.sho + face.pas + face.dri + face.def + face.phy;
  const avgFace = sumFace / 6;

  const advKeys = [
    'Acceleration','Sprint Speed','Positioning','Finishing','Shot Power','Long Shots','Volleys',
    'Penalties','Vision','Crossing','Free Kick Accuracy','Short Passing','Long Passing','Curve',
    'Dribbling','Agility','Balance','Reactions','Ball Control','Composure','Interceptions',
    'Heading Accuracy','Def Awareness','Standing Tackle','Sliding Tackle','Jumping','Stamina',
    'Strength','Aggression',
  ];

  let sum = 0, cnt = 0;
  for (const k of advKeys) {
    if (full[k] != null) {
      sum += full[k];
      cnt++;
    }
  }
  const avgAdv = cnt ? sum / cnt : 0;

  return 0.2 * face.ovr + 0.5 * avgFace + 0.3 * avgAdv;
}

/* -------------------------------------------------------------------------- */
/*  UTILITIES                                                                 */
/* -------------------------------------------------------------------------- */

function buildInitialStats(p: Player): Stats {
  return {
    ovr: p.OVR,
    pac: p.PAC,
    sho: p.SHO,
    pas: p.PAS,
    dri: p.DRI,
    def: p.DEF,
    phy: p.PHY,
    skillMoves: p.skillMoves,
    weakFoot: p.weakFoot,
  };
}

function statKeyMapping(k: string): keyof Stats | undefined {
  const map: Record<string, keyof Stats> = {
    Overall: 'ovr',
    Pace: 'pac',
    Shooting: 'sho',
    Dribbling: 'dri',
    Defending: 'def',
    Physicality: 'phy',
    Passing: 'pas',
    'Skill Moves': 'skillMoves',
    'Weak Foot': 'weakFoot',
    SM: 'skillMoves',
    WF: 'weakFoot',
  };
  return map[k];
}

function parseRequirement(req: string): { type: 'min' | 'max'; value: number } | null {
  const m = req.match(/^(Min\.?|Max\.?)(?:\s*)(\d+)$/i);
  if (!m) return null;
  return {
    type: m[1].toLowerCase().startsWith('min') ? 'min' : 'max',
    value: +m[2],
  };
}

function parseUpgradeLine(line: string): ParsedUpgrade {
  const l = line.replace(/★/g, '').trim();

  /* ---------- Rarity ---------- */
  if (l.startsWith('Rarity')) return { type: 'rarity', text: l.slice(6).trim() };

  /* ---------- PlayStyle+ ---------- */
  if (/^PlayStyle\+/i.test(l)) {
    const m = l.match(/^PlayStyle\+\s*([^(]+?)\s*(?:\(\^(\d+)\))?$/i)!;
    return { type: 'playstylePlus', key: m[1].trim(), cap: m[2] ? +m[2] : undefined };
  }

  /* ---------- PlayStyle ---------- */
  if (/^PlayStyle\s/i.test(l)) {
    const m = l.match(/^PlayStyle\s*([^(]+?)\s*(?:\(\^(\d+)\))?$/i)!;
    return { type: 'playstyle', key: m[1].trim(), cap: m[2] ? +m[2] : undefined };
  }

  /* ---------- New Pos. ---------- */
  if (/^New Pos\./i.test(l)) {
    const m = l.match(/^New Pos\.\s*([^(]+?)\s*(?:\(\^(\d+)\))?$/i)!;
    return { type: 'newPos', key: m[1].trim(), cap: m[2] ? +m[2] : undefined };
  }

  /* ---------- Role++ / Role+ ---------- */
  if (/^Role\+\+/i.test(l)) {
    const m = l.match(/^Role\+\+\s*([^(]+?)\s*(?:\(\^(\d+)\))?$/i)!;
    return { type: 'rolePlus', key: m[1].trim(), cap: m[2] ? +m[2] : undefined };
  }
  if (/^Role\+/i.test(l)) {
    const m = l.match(/^Role\+\s*([^(]+?)\s*(?:\(\^(\d+)\))?$/i)!;
    return { type: 'role', key: m[1].trim(), cap: m[2] ? +m[2] : undefined };
  }

  /* ---------- STAT ---------- */
  const statRe = /^([\w\.\s]+?)\s+([+\-]\d+)(?:.*?\(\^(\d+)\))?/;
  const m = l.match(statRe);
  if (m) {
    let key = m[1].trim();
    const norm: Record<string, string> = {
      'Att. Position': 'Positioning',
      'Heading Acc.':  'Heading Accuracy',
      'Def. Aware':    'Def Awareness',
      'FK. Acc.':      'Free Kick Accuracy',
      'Fk Accuracy':   'Free Kick Accuracy',
      'Short Pass':    'Short Passing',
      'Long Pass':     'Long Passing',
      'Slide Tackle':  'Sliding Tackle',
      'Stand Tackle':  'Standing Tackle',
    };
    if (norm[key]) key = norm[key];

    return { type: 'stat', key, delta: +m[2], cap: m[3] ? +m[3] : undefined };
  }

  return { type: 'unknown' };
}

let _playersCache: Player[] | null = null;
async function cachedPlayers(): Promise<Player[]> {
  if (_playersCache) return _playersCache;
  const res = await fetch('/data/players.csv');
  const txt = await res.text();
  _playersCache = parseCSV(txt);
  return _playersCache;
}

function splitCSVLine(line: string): string[] {
  const res: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const nx = line[i + 1];
    if (inQ && ch === '"' && nx === '"') {
      cur += '"';
      i++;
      continue;
    }
    if (ch === '"') {
      inQ = !inQ;
      continue;
    }
    if (ch === ',' && !inQ) {
      res.push(cur);
      cur = '';
    } else cur += ch;
  }
  res.push(cur);
  return res.map((s) => s.trim());
}

function parseCSV(txt: string): Player[] {
  const lines = txt.split('\n').filter((l) => l.trim());
  const hdr = splitCSVLine(lines[0]);
  const numeric = [
    'OVR','PAC','SHO','PAS','DRI','DEF','PHY','Acceleration','Sprint Speed',
    'Positioning','Finishing','Shot Power','Long Shots','Volleys','Penalties',
    'Vision','Crossing','Free Kick Accuracy','Short Passing','Long Passing','Curve',
    'Dribbling','Agility','Balance','Reactions','Ball Control','Composure',
    'Interceptions','Heading Accuracy','Def Awareness','Standing Tackle','Sliding Tackle',
    'Jumping','Stamina','Strength','Aggression','Skill moves','Weak foot',
  ];

  const players: Player[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = splitCSVLine(lines[i]);
    const obj: any = {};
    hdr.forEach((h, j) => (obj[h] = vals[j] ?? ''));
    numeric.forEach((c) => {
      if (obj[c] !== '') obj[c] = +obj[c];
    });

    // gestione posizioni
    const parts = (obj['Position'] || '')
      .split(/[\/;,]/)
      .map((s: string) => s.trim())
      .filter(Boolean);
    obj.Position = parts[0] || '';
    obj.alternativePositions = [
      ...parts.slice(1),
      ...(obj['Alternative positions']
        ? obj['Alternative positions']
            .split(obj['Alternative positions'].includes(';') ? ';' : ',')
            .map((s: string) => s.trim())
        : []),
    ];

    obj.skillMoves = +obj['Skill moves'];
    obj.weakFoot = +obj['Weak foot'];
    obj.fullStats = {};
    numeric.forEach((c) => {
      if (obj[c] != null) obj.fullStats[c] = obj[c];
    });

    players.push(obj as Player);
  }
  return players;
}
