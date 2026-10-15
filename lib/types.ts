export type Game = { id: string; name: string; english: string; bggId?: number; minPlayers?: number; maxPlayers?: number; minutes?: number; color: string; motif: string; scoring: 'high' | 'low' | 'coop'; image?: string };
export type Player = { id: string; name: string; color: string };
export type Outcome = 'cleared' | 'failed' | 'paused';
export type Play = { id: string; gameId: string; date: string; duration?: number; scores: { playerId: string; score?: number }[]; scenario?: string; outcome?: Outcome; note?: string; version: number };
export type Data = { games: Game[]; players: Player[]; plays: Play[] };
export type Mode = 'loading' | 'demo' | 'mongo' | 'error';
