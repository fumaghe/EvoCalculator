// src/types.ts
export interface Evolution {
  id: string;
  name: string;
  unlock_date: string;
  expires_on: string;
  cost: string;
  requirements: Record<string, string>;
  challenges: string[];
  upgrades: { step: number; description: string[]; effects: Record<string, number> }[];
  new_positions: string[];
  playstyles_added: string[];
  playstyles_plus_added: string[];
  final_bonus: Record<string, string>;
  url: string;
  total_upgrades?: Record<string, string>;
}

export interface Player {
  ID: number;
  Rank: number;
  Name: string;
  OVR: number;
  PAC: number;
  SHO: number;
  PAS: number;
  DRI: number;
  DEF: number;
  PHY: number;
  Acceleration: number;
  SprintSpeed: number;
  Positioning: number;
  Finishing: number;
  ShotPower: number;
  LongShots: number;
  Volleys: number;
  Penalties: number;
  Vision: number;
  Crossing: number;
  FreeKickAccuracy: number;
  ShortPassing: number;
  LongPassing: number;
  Curve: number;
  Dribbling: number;
  Agility: number;
  Balance: number;
  Reactions: number;
  BallControl: number;
  Composure: number;
  Interceptions: number;
  HeadingAccuracy: number;
  DefAwareness: number;
  StandingTackle: number;
  SlidingTackle: number;
  Jumping: number;
  Stamina: number;
  Strength: number;
  Aggression: number;
  Position: string;
  WeakFoot: number;
  SkillMoves: number;
  PreferredFoot: 'Left' | 'Right';
  Height: string;
  Weight: string;
  AlternativePositions: string;
  Age: number;
  Nation: string;
  League: string;
  Team: string;
  PlayStyle: string;
  url: string;
  // campi GK opzionali
  GK_Diving?: number;
  GK_Handling?: number;
  GK_Kicking?: number;
  GK_Positioning?: number;
  GK_Reflexes?: number;
}
