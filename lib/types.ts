export type Game = { id: string; name: string; english: string; bggId?: number; minPlayers: number; maxPlayers: number; minutes: number; color: string; motif: string; scoring: 'high' | 'low'; image?: string };
export type Player = { id: string; name: string; color: string };
export type Play = { id: string; gameId: string; date: string; duration: number; scores: { playerId: string; score: number }[]; note: string; version: number };
export type Data = { games: Game[]; players: Player[]; plays: Play[] };
export type Mode = 'loading' | 'demo' | 'mongo' | 'error';
