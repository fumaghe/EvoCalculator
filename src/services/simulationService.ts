// src/services/simulationService.ts
// Logica aggiornata: dynamic increment per PlayStyle/PlayStyle+, SM e WF, e propagazione uniforme delle sub‑statistiche

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
  score?: number;
  evolutionOrder: string[];
  playstyles: string[];
  playstylesPlus: string[];
  roles: string[];
  finalStats: Stats;
  deadline: Date;
  fullStatsBefore: { [key: string]: number };  // <<< aggiunto
  fullStats:       { [key: string]: number };
}

export interface Evolution {
  id: string;
  name: string;
  unlock_date: string;
  expires_on: string;
  cost: string;
  requirements: { [key: string]: string };
  total_upgrades?: { [key: string]: string };
  challenges: string[];
  upgrades: {
    step: number;
    description: string[];
    effects: { [key: string]: number };
  }[];
  new_positions: string[];
  playstyles_added: string[];
  playstyles_plus_added: string[];
  final_bonus: { [key: string]: string } | {};
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
  "play style": string;
  weakFoot: number;
  skillMoves: number;
  fullStats?: { [key: string]: number };
}

const FACE_STAT_MAX = 99;

/**
 * Paginazione lazy + filtro + simulazione
 */
export async function runSimulationPage(
  selectedEvos: Evolution[],
  targetRole: string,
  skip: number,
  limit: number,
  searchQuery: string = ""
): Promise<SimulationResult[]> {
  const players: Player[] = await loadPlayers();
  const today = new Date();

  const filtered = players.filter(p => {
    const main = p.Position.toUpperCase();
    const alts = p.alternativePositions.map(r => r.toUpperCase());
    return main === targetRole.toUpperCase() || alts.includes(targetRole.toUpperCase());
  });

  const validEvos = selectedEvos.filter(e => new Date(e.expires_on) >= today);
  const evoPerms = generatePermutations(validEvos);

  const results: SimulationResult[] = [];
  let matched = 0;

  for (const player of filtered) {
    const initialStats: Stats = {
      ovr: player.OVR,
      pac: player.PAC,
      sho: player.SHO,
      pas: player.PAS,
      dri: player.DRI,
      def: player.DEF,
      phy: player.PHY,
      skillMoves: player.skillMoves,
      weakFoot: player.weakFoot
    };

    for (const seq of evoPerms) {
      // catturo le sub‑stats "before"
      const initialFull = { ...(player.fullStats || {}) };

      const out = simulateEvoSequence(player, seq);
      if (!out.success) continue;

      const sim: SimulationResult = {
        playerName:       player.Name,
        initialStats,
        score:            calculateCustomScore(out.finalStats, out.fullStats),
        evolutionOrder:   seq.map(e => e.name),
        playstyles:       out.playstyles,
        playstylesPlus:   out.playstylesPlus,
        roles:            out.roles,
        finalStats:       out.finalStats,
        deadline:         out.deadline,
        fullStatsBefore:  initialFull,    // <<< qui
        fullStats:        out.fullStats,  // <<< già esistente
      };

      if (
        searchQuery &&
        !sim.playerName.toLowerCase().includes(searchQuery.toLowerCase())
      ) continue;

      if (matched < skip) {
        matched++;
        continue;
      }

      results.push(sim);
      if (results.length >= limit) return results;
      matched++;
    }
  }

  return results;
}

function generatePermutations<T>(arr: T[]): T[][] {
  const res: T[][] = [];
  function perm(cur: T[], rem: T[]) {
    if (!rem.length) {
      res.push([...cur]);
      return;
    }
    for (let i = 0; i < rem.length; i++) {
      cur.push(rem[i]);
      perm(cur, rem.slice(0, i).concat(rem.slice(i + 1)));
      cur.pop();
    }
  }
  perm([], arr);
  return res;
}

interface SimulationOutcome {
  success: boolean;
  finalStats: Stats;
  playstyles: string[];
  playstylesPlus: string[];
  roles: string[];
  deadline: Date;
  fullStatsBefore: { [key: string]: number };  // <<< aggiunto
  fullStats:       { [key: string]: number };
}

function simulateEvoSequence(player: Player, seq: Evolution[]): SimulationOutcome {
  const currentStats: Stats = {
    ovr: player.OVR,
    pac: player.PAC,
    sho: player.SHO,
    pas: player.PAS,
    dri: player.DRI,
    def: player.DEF,
    phy: player.PHY,
    skillMoves: player.skillMoves,
    weakFoot: player.weakFoot,
  };

  // copia iniziale delle statistiche avanzate
  const advancedStats = { ...(player.fullStats || {}) };
  const fullStatsBefore = { ...advancedStats };

  // mapping faccia → sotto‑statistiche
  const advancedGroups: Record<string, string[]> = {
    Pace:        ['Acceleration', 'Sprint Speed'],
    Shooting:    ['Positioning','Finishing','Shot Power','Long Shots','Volleys','Penalties'],
    Passing:     ['Vision','Crossing','Free Kick Accuracy','Short Passing','Long Passing','Curve'],
    Dribbling:   ['Agility','Balance','Reactions','Ball Control','Dribbling','Composure'],
    Defending:   ['Interceptions','Heading Accuracy','Def Awareness','Standing Tackle','Sliding Tackle'],
    Physicality: ['Jumping','Stamina','Strength','Aggression'],
  };

  function updateAdvanced(key: string, delta: number, cap?: number) {
    const old = advancedStats[key] ?? 0;
    const capped = cap !== undefined ? Math.min(old + delta, cap) : old + delta;
    advancedStats[key] = Math.max(old, capped);
  }

  const rawPlaystyles = player["play style"]
    ? player["play style"].split(',').map(s => s.trim())
    : [];
  const plainSet = new Set(rawPlaystyles.filter(ps => !ps.endsWith('+')));
  const plusSet  = new Set(rawPlaystyles.filter(ps => ps.endsWith('+')).map(ps => ps.slice(0,-1)));

  let currentRarity = "";
  const roles = new Set<string>([player.Position, ...player.alternativePositions]);
  let deadline = new Date("9999-12-31");

  const statMap: Record<string, keyof Stats> = {
    Overall: "ovr", Pace: "pac", Shooting: "sho", Dribbling: "dri",
    Defending: "def", Physicality: "phy", Passing: "pas",
    "Skill Moves": "skillMoves", "Weak Foot": "weakFoot"
  };

  for (const evo of seq) {
    // --- requirements, PS eligibility, deadline & roles as before ---
    // 1) Requirements generali
    for (const key in evo.requirements) {
      const req = evo.requirements[key]!;
      if (statMap[key]) {
        const { type, value } = parseRequirement(req)!;
        const v = currentStats[statMap[key]];
        if ((type === "max" && v > value) || (type === "min" && v < value)) {
          return fail();
        }
      } else if (key === "Position" && !roles.has(req)) {
        return fail();
      } else if (key === "Rarity" && currentRarity !== req) {
        return fail();
      }
    }
    // 2) Eligibility PS
    const reqPSPlus = evo.requirements["Max PS+"] ? Number(evo.requirements["Max PS+"]) : Infinity;
    const reqPS     = evo.requirements["Max PS"]  ? Number(evo.requirements["Max PS"])  : Infinity;
    if (plusSet.size > reqPSPlus || plainSet.size > reqPS) return fail();
    // 3) Deadline & new positions
    const d = new Date(evo.expires_on);
    if (d < deadline) deadline = d;
    evo.new_positions.forEach(p => roles.add(p));

    // 4) Apply each upgrade step
    for (const up of evo.upgrades) {
      for (const line of up.description) {
        const parsed = parseUpgradeLine(line);
        if (parsed.type === 'stat' && parsed.key && parsed.delta != null) {
          // faccia: calcola incremento netto considerando cap specifico
          const sk = statKeyMapping(parsed.key)!;
          const oldFace = currentStats[sk];
          const rawNew = oldFace + parsed.delta;
          const cap = parsed.cap ?? FACE_STAT_MAX;
          const newFace = Math.min(rawNew, cap);
          currentStats[sk] = Math.max(oldFace, newFace);
          const appliedDelta = currentStats[sk] - oldFace;

          // Advanced: propaga lo stesso incremento netto
          updateAdvanced(parsed.key, appliedDelta, parsed.cap);
          const subs = advancedGroups[parsed.key];
          if (subs) {
            for (const subKey of subs) {
              updateAdvanced(subKey, appliedDelta);
            }
          }
          continue;
        }

        // playstyle, playstylePlus, rarity, newPos, role...
        switch (parsed.type) {
          case "playstyle":
            if (parsed.key && plainSet.size < reqPS) plainSet.add(parsed.key);
            break;
          case "playstylePlus":
            if (parsed.key && plusSet.size < (parsed.cap ?? Infinity)) plusSet.add(parsed.key);
            break;
          case "rarity":
            if (parsed.text) currentRarity = parsed.text;
            break;
          case "newPos":
          case "role":
          case "rolePlus":
            if (parsed.key) roles.add(parsed.key);
            break;
        }
      }
    }

    // 5) Static additions
    evo.playstyles_added.forEach(ps => {
      if (plainSet.size < reqPS) plainSet.add(ps);
    });
    evo.playstyles_plus_added.forEach(ps => {
      if (plusSet.size < reqPSPlus) plusSet.add(ps);
    });
  }

  return {
    success: true,
    finalStats: currentStats,
    playstyles: Array.from(plainSet),
    playstylesPlus: Array.from(plusSet),
    roles: Array.from(roles),
    deadline,
    fullStatsBefore,
    fullStats: advancedStats
  };

  function fail(): SimulationOutcome {
    return {
      success: false,
      finalStats: currentStats,
      playstyles: Array.from(plainSet),
      playstylesPlus: Array.from(plusSet),
      roles: Array.from(roles),
      deadline,
      fullStatsBefore,
      fullStats: advancedStats
    };
  }
}


function statKeyMapping(k: string): keyof Stats | undefined {
  return ({
    Overall: "ovr",
    Pace: "pac",
    Shooting: "sho",
    Dribbling: "dri",
    Defending: "def",
    Physicality: "phy",
    Passing: "pas",
    SM: "skillMoves",
    WF: "weakFoot",
  } as Record<string, keyof Stats>)[k];
}

function parseRequirement(req: string): { type: "max" | "min"; value: number } | null {
  const m = req.match(/^(Max\.?|Min\.?)\s*(\d+)$/i);
  if (!m) return null;
  return {
    type: m[1].toLowerCase().startsWith("max") ? "max" : "min",
    value: parseInt(m[2], 10),
  };
}

interface ParsedUpgrade {
  type: "stat" | "playstyle" | "playstylePlus" | "newPos" | "role" | "rolePlus" | "rarity" | "unknown";
  key?: string;
  delta?: number;
  cap?: number;
  text?: string;
}

function parseUpgradeLine(line: string): ParsedUpgrade {
  const l = line.trim();

  if (l.startsWith("Rarity")) {
    return { type: "rarity", text: l.slice("Rarity".length).trim() };
  }
  if (/^PlayStyle\+/.test(l)) {
    const m = l.match(/^PlayStyle\+\s*([^(]+)(?:\(\^(\d+)\))?/)!;
    return {
      type: "playstylePlus",
      key: m[1].trim(),
      cap: m[2] ? +m[2] : undefined
    };
  }
  if (/^PlayStyle/.test(l)) {
    const m = l.match(/^PlayStyle\s*([^(]+)(?:\(\^(\d+)\))?/)!;
    return {
      type: "playstyle",
      key: m[1].trim(),
      cap: m[2] ? +m[2] : undefined
    };
  }
  if (/^New Pos\./.test(l)) {
    const m = l.match(/^New Pos\.\s*([^(]+)(?:\(\^(\d+)\))?/)!;
    return {
      type: "newPos",
      key: m[1].trim(),
      cap: m[2] ? +m[2] : undefined
    };
  }
  if (/^Role\+\+/.test(l)) {
    const m = l.match(/^Role\+\+\s*([^(]+)(?:\(\^(\d+)\))?/)!;
    return {
      type: "rolePlus",
      key: m[1].trim(),
      cap: m[2] ? +m[2] : undefined
    };
  }

  // catch stat lines, incl. SM, WF, substats with stars and cap
  const statRegex = /^([\w\.\s]+)\s*([\+\-]\d+)\s*(?:★)?\s*(?:\(\^(\d+)\))?/;
  const sm = l.match(statRegex);
  if (sm) {
    let key = sm[1].trim();
    const norm: Record<string,string> = {
      "Att. Position":"Positioning",
      "Heading Acc.":"Heading Accuracy",
      "Def. Aware":"Def Awareness",
      "FK. Acc.":"Free Kick Accuracy",
      "Short Pass":"Short Passing",
      "Long Pass":"Long Passing",
      "Slide Tackle":"Sliding Tackle",
      "Stand Tackle":"Standing Tackle"
    };
    if (norm[key]) key = norm[key];
    return {
      type: "stat",
      key,
      delta: +sm[2],
      cap: sm[3] ? +sm[3] : undefined
    };
  }

  return { type: "unknown", text: l };
}

function calculateCustomScore(face: Stats, fullStats: { [key: string]: number }): number {
  const sumFace = face.pac + face.sho + face.pas + face.dri + face.def + face.phy;
  const avgFace = sumFace / 6;

  const advKeys = [
    "Acceleration", "Sprint Speed",
    "Positioning", "Finishing", "Shot Power", "Long Shots",
    "Volleys", "Penalties", "Vision", "Crossing", "Free Kick Accuracy", "Short Passing",
    "Long Passing", "Curve", "Dribbling", "Agility", "Balance", "Reactions", "Ball Control",
    "Composure", "Interceptions", "Heading Accuracy", "Def Awareness", "Standing Tackle",
    "Sliding Tackle", "Jumping", "Stamina", "Strength", "Aggression"
  ];

  let sumAdv = 0, cnt = 0;
  for (const k of advKeys) {
    if (fullStats[k] !== undefined) {
      sumAdv += fullStats[k];
      cnt++;
    }
  }
  const avgAdv = cnt > 0 ? sumAdv / cnt : 0;

  return 0.2 * face.ovr + 0.5 * avgFace + 0.3 * avgAdv;
}

async function loadPlayers(): Promise<Player[]> {
  const res = await fetch('/data/players.csv');
  const txt = await res.text();
  return parseCSV(txt);
}

// utility: split solo alle virgole fuori da virgolette
function splitCSVLine(line: string): string[] {
  const res: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue; // non vogliamo tenere le virgolette nel campo
    }
    if (ch === ',' && !inQuotes) {
      res.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  res.push(cur);

  // rimuovo eventuali spazi esterni
  return res.map(s => s.trim());
}

function parseCSV(txt: string): Player[] {
  const lines = txt.split('\n').filter(l => l.trim());
  // header splittata correttamente
  const hdr = splitCSVLine(lines[0]).map(h => h.trim());
  const numericCols = [
    "OVR","PAC","SHO","PAS","DRI","DEF","PHY",
    "Acceleration","Sprint Speed","Positioning","Finishing","Shot Power","Long Shots",
    "Volleys","Penalties","Vision","Crossing","Free Kick Accuracy","Short Passing",
    "Long Passing","Curve","Dribbling","Agility","Balance","Reactions","Ball Control",
    "Composure","Interceptions","Heading Accuracy","Def Awareness","Standing Tackle",
    "Sliding Tackle","Jumping","Stamina","Strength","Aggression","Skill moves","Weak foot"
  ];

  const players: Player[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = splitCSVLine(lines[i]);
    const obj: any = {};

    // assegno tutti i campi
    hdr.forEach((h, j) => {
      obj[h] = vals[j] ?? '';
    });

    // converti i campi numerici
    numericCols.forEach(c => {
      if (obj[c] !== undefined && obj[c] !== '') {
        obj[c] = Number(obj[c]);
      }
    });

    // alternativePositions (anch’esso può avere virgole o punti‑e‑virgola)
    obj.alternativePositions = obj['Alternative positions']
      ? obj['Alternative positions']
          .split(obj['Alternative positions'].includes(';') ? ';' : ',')
          .map((s: string) => s.trim())
      : [];

    obj.Position = obj.Position || '';
    obj.skillMoves = Number(obj['Skill moves']);
    obj.weakFoot = Number(obj['Weak foot']);

    // fullStats = mappa tutte le stat avanzate
    obj.fullStats = {};
    numericCols.forEach(c => {
      if (obj[c] !== undefined) {
        obj.fullStats[c] = obj[c];
      }
    });

    players.push(obj as Player);
  }

  return players;
}