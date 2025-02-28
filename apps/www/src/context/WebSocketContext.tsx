"use client"
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useUser } from '@/context/UserContext';

const WebSocketContext = createContext<any>(null);
const HEARTBEAT_INTERVAL = process.env.NEXT_PUBLIC_APP_ENV === "development" ? 3000 : 30000;
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const socketRef = useRef<WebSocket | null>(null);
    const heartbeatRef = useRef<number | null>(null);
    const { id } = useUser();
    const URL = process.env.NEXT_PUBLIC_WS_URL;

    useEffect(() => {
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;

        const sendHeartbeat = () => {
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({ event: 'HEARTBEAT' }));
            }
        };

        const connectWebSocket = () => {
            socketRef.current = new WebSocket(`${URL}?userId=${id}`);

            socketRef.current.onopen = () => {
                console.log('Conectado ao WebSocket');
                reconnectAttempts = 0; // Resetar tentativas de reconexão
                heartbeatRef.current = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
            };

            socketRef.current.onmessage = (event) => {
                const message = JSON.parse(event.data);
                console.log('Mensagem recebida:', message);
            };

            socketRef.current.onclose = () => {
                console.log('Desconectado do WebSocket');
                if (heartbeatRef.current) {
                    clearInterval(heartbeatRef.current);
                }
                if (reconnectAttempts < maxReconnectAttempts) {
                    setTimeout(() => {
                        reconnectAttempts++;
                        connectWebSocket();
                    }, 2000); // Tentar reconectar após 2 segundos
                }
            };
        };

        connectWebSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
            }
        };
    }, [id, URL]);

    const sendMessage = (to: number, text: string) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            const message = {
                event: 'MESSAGE',
                content: { to, text },
            };
            socketRef.current.send(JSON.stringify(message));
        }
    };

    const sendFriendRequest = (to: number) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            const request = {
                event: 'FRIEND_REQUEST',
                content: { to },
            };
            socketRef.current.send(JSON.stringify(request));
        }
    };

    const acceptFriendRequest = (from: number) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            console.log('Enviando solicitação de amizade aceita', from);
            const request = {
                event: 'FRIEND_REQUEST_ACCEPTED',
                content: { from },
            };
            socketRef.current.send(JSON.stringify(request));
        }
    }

    const sendTradeRequest = (recipient: number) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            const request = {
                event: 'TRADE_REQUEST',
                content: { recipient },
            };
            socketRef.current.send(JSON.stringify(request));
        }
    };

    return (
        <WebSocketContext.Provider value={{
            socket: socketRef.current,
            sendMessage,
            sendFriendRequest,
            sendTradeRequest,
            acceptFriendRequest
        }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    return useContext(WebSocketContext) as {
        socket: WebSocket | null;
        sendMessage: (to: number, text: string) => void;
        sendFriendRequest: (to: number) => void;
        sendTradeRequest: (recipient: number) => void;
        acceptFriendRequest: (from: number) => void;
    };
}; 