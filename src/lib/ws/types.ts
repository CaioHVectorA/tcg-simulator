// types.ts
export enum WSEvent {
  Message = "MESSAGE",
  FriendRequest = "FRIEND_REQUEST",
  TradeRequest = "TRADE_REQUEST",
  Heartbeat = "HEARTBEAT",
}

export interface WSMessage<T = any> {
  event: WSEvent;
  content: T;
  timestamp: number;
}

export type MessageContent = {
  to: number;
  text: string;
  from: number;
};

export type FriendRequestContent = {
  from: number;
  to: number;
};

export type TradeRequestContent = {
  initiator: number;
  recipient: number;
  items: string[];
};
