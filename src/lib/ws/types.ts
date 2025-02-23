// types.ts
export enum WSEvent {
  Message = "MESSAGE",
  FriendRequest = "FRIEND_REQUEST",
  TradeRequest = "TRADE_REQUEST",
}

export interface WSMessage<T = any> {
  event: WSEvent;
  content: T;
  timestamp: number;
}

export type MessageContent = {
  to: string;
  text: string;
  from: string;
};

export type FriendRequestContent = {
  from: string;
  to: string;
};

export type TradeRequestContent = {
  initiator: string;
  recipient: string;
  items: string[];
};
