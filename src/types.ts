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
  }
  