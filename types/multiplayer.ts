import type { GameState, Player } from "./game";
import type { GameRules } from "./rules";
import type { CardColor, CardValue } from "./card";
import type { Card } from "./card";

/** A private hand is absent, rather than populated with fake card faces. */
export interface PlayerView extends Omit<Player, "hand"> {
  handCount: number;
  hand?: Card[];
}

export interface GameView extends Omit<GameState, "players" | "drawPile"> {
  players: PlayerView[];
  drawPileCount: number;
}

export interface PendingColorChoice {
  playerId: string;
  cardId: string;
  cardValue: CardValue;
}

export interface RoomPlayer {
  playerId: string;
  name: string;
  connected: boolean;
  isBot: boolean;
  friendCode?: string;
  ready: boolean;
}

export interface RoomSnapshot {
  roomId: string;
  hostPlayerId: string;
  players: RoomPlayer[];
  started: boolean;
  game: GameView | null;
  pendingColorChoice:
    | (Pick<PendingColorChoice, "playerId"> &
        Partial<Omit<PendingColorChoice, "playerId">>)
    | null;
  rules?: Partial<GameRules>;
}

export interface FriendInvite {
  inviteId: string;
  roomId: string;
  fromPlayerId: string;
  fromName: string;
  fromFriendCode: string;
  createdAt: number;
}

export type MultiplayerAction =
  | { type: "prepareWild"; cardId: string }
  | { type: "cancelWildChoice" }
  | { type: "play"; cardId: string; chosenColor?: CardColor }
  | { type: "draw" }
  | { type: "pass" }
  | { type: "sayUno" }
  | { type: "callOut"; targetPlayerId: string };

export interface CreateRoomPayload {
  playerName: string;
  deviceId: string;
  rules?: Partial<GameRules>;
}

export interface UpdateRulesPayload {
  roomId: string;
  rules: Partial<GameRules>;
}

export interface PresencePayload {
  playerName: string;
  deviceId: string;
  friendCode: string;
}

export interface JoinRoomPayload {
  roomId: string;
  playerName: string;
  deviceId: string;
}

export interface StartRoomPayload {
  roomId: string;
  rules?: Partial<GameRules>;
}

export interface KickPlayerPayload {
  roomId: string;
  targetPlayerId: string;
}

export interface AddBotPayload {
  roomId: string;
}

export interface LeaveRoomPayload {
  roomId: string;
}

export interface ReadyPayload {
  roomId: string;
}

export interface ReturnToLobbyPayload {
  roomId: string;
}

export interface RoomActionPayload {
  roomId: string;
  action: MultiplayerAction;
}

export interface SendFriendInvitePayload {
  targetFriendCode: string;
  playerName: string;
  deviceId: string;
  friendCode: string;
}

export interface RespondFriendInvitePayload {
  inviteId: string;
  playerName: string;
  deviceId: string;
  friendCode: string;
}

export interface DismissFriendInvitePayload {
  inviteId: string;
}

export interface FriendStatusPayload {
  friendCodes: string[];
}

export type FriendPresenceState = "offline" | "online" | "playing";

export interface FriendStatusResponse {
  statuses: Record<string, FriendPresenceState>;
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
