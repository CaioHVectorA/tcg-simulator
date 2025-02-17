"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function MoneyTransfer() {
    const [recipient, setRecipient] = useState("")
    const [amount, setAmount] = useState("")

    const handleTransfer = () => {
        // Here you would typically send the transfer request to your backend
        console.log(`Transferring ${amount} to ${recipient}`)
        // Reset form after transfer
        setRecipient("")
        setAmount("")
    }

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">Money Transfer</h2>
            <div className="space-y-2">
                <Label htmlFor="recipient">Recipient</Label>
                <Input
                    id="recipient"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Enter recipient's username"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                />
            </div>
            <Button onClick={handleTransfer}>Send Money</Button>
        </div>
    )
}

