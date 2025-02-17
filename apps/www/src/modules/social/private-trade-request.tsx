"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function PrivateTradeRequest() {
    const [recipient, setRecipient] = useState("")
    const [tradeDetails, setTradeDetails] = useState("")

    const handleSendRequest = () => {
        // Here you would typically send the trade request to your backend
        console.log(`Sending trade request to ${recipient}: ${tradeDetails}`)
        // Reset form after sending request
        setRecipient("")
        setTradeDetails("")
    }

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">Private Trade Request</h2>
            <div className="space-y-2">
                <Label htmlFor="trade-recipient">Recipient</Label>
                <Input
                    id="trade-recipient"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Enter recipient's username"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="trade-details">Trade Details</Label>
                <Textarea
                    id="trade-details"
                    value={tradeDetails}
                    onChange={(e) => setTradeDetails(e.target.value)}
                    placeholder="Describe the trade you want to propose"
                    rows={4}
                />
            </div>
            <Button onClick={handleSendRequest}>Send Trade Request</Button>
        </div>
    )
}

