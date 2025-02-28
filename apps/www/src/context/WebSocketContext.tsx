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
        const sendHeartbeat = () => {
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({ event: 'HEARTBEAT' }));
            }
        };

        socketRef.current = new WebSocket(`${URL}?userId=${id}`);

        socketRef.current.onopen = () => {
            console.log('Conectado ao WebSocket');
            heartbeatRef.current = window.setInterval(sendHeartbeat, 30000);
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
        };

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
            }
        };
    }, [id, URL]);

    return (
        <WebSocketContext.Provider value={socketRef.current}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    return useContext(WebSocketContext);
}; 