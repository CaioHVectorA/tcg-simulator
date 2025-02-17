"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

export function MessageBox() {
    const [messages, setMessages] = useState<{ sender: string; content: string }[]>([])
    const [newMessage, setNewMessage] = useState("")

    const sendMessage = () => {
        if (newMessage.trim()) {
            setMessages([...messages, { sender: "You", content: newMessage }])
            setNewMessage("")
            // Here you would typically send the message to your backend
        }
    }

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">Messages</h2>
            <ScrollArea className="h-[300px] border rounded-md p-4">
                {messages.map((msg, index) => (
                    <div key={index} className="mb-2">
                        <span className="font-bold">{msg.sender}: </span>
                        <span>{msg.content}</span>
                    </div>
                ))}
            </ScrollArea>
            <div className="flex space-x-2">
                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." />
                <Button onClick={sendMessage}>Send</Button>
            </div>
        </div>
    )
}

