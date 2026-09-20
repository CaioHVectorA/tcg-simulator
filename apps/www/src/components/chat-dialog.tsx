"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/avatar";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/context/WebSocketContext";
import { useUser } from "@/context/UserContext";

export interface ChatFriend {
  id: number;
  username: string;
  picture?: string;
  online?: boolean;
}

interface ChatDialogProps {
  friend: ChatFriend | null;
  isOpen: boolean;
  onClose: () => void;
}

interface MessageItem {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  createdAt: string;
  viewed: boolean;
}

export const ChatDialog: React.FC<ChatDialogProps> = () => {
  return null;
};
