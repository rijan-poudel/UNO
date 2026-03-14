import type { GameState } from './game';
import type { GameRules } from './rules';
import type { CardColor } from './card';

export interface RoomPlayer {
  playerId: string;
  name: string;
  connected: boolean;
}

export interface RoomSnapshot {
  roomId: string;
  hostPlayerId: string;
  players: RoomPlayer[];
  started: boolean;
  game: GameState | null;
}

export type MultiplayerAction =
  | { type: 'play'; cardId: string; chosenColor?: CardColor }
  | { type: 'draw' }
  | { type: 'pass' }
  | { type: 'sayUno' }
  | { type: 'callOut'; targetPlayerId: string };

export interface CreateRoomPayload {
  playerName: string;
}

export interface JoinRoomPayload {
  roomId: string;
  playerName: string;
}

export interface StartRoomPayload {
  roomId: string;
  rules?: Partial<GameRules>;
}

export interface KickPlayerPayload {
  roomId: string;
  targetPlayerId: string;
}

export interface RoomActionPayload {
  roomId: string;
  action: MultiplayerAction;
}

export interface AckSuccess<T> {
  ok: true;
  data: T;
}

export interface AckError {
  ok: false;
  error: string;
}

export type Ack<T> = AckSuccess<T> | AckError;
