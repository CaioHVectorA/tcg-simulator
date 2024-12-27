"use client"

import React, { useState, useCallback } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type NumberQuantityInputProps = {
    initialValue?: number
    min?: number
    max?: number
    step?: number
    onChange?: (value: number) => void
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>

export function NumberQuantityInput({
    initialValue = 1,
    min = 0,
    max = Infinity,
    step = 1,
    onChange,
    ...rest
}: NumberQuantityInputProps) {
    const [value, setValue] = useState(initialValue)

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseInt(e.target.value, 10)
        if (!isNaN(newValue) && newValue >= min && newValue <= max) {
            setValue(newValue)
            onChange?.(newValue)
        }
    }, [min, max, onChange])

    const handleIncrement = useCallback(() => {
        const newValue = Math.min(value + step, max)
        setValue(newValue)
        onChange?.(newValue)
    }, [value, step, max, onChange])

    const handleDecrement = useCallback(() => {
        const newValue = Math.max(value - step, min)
        setValue(newValue)
        onChange?.(newValue)
    }, [value, step, min, onChange])

    return (
        <div {...rest} className={cn("flex items-center space-x-2", rest.className)}>
            <Button
                variant="outline"
                size="icon"
                onClick={handleDecrement}
                disabled={value <= min}
                aria-label="Decrease quantity"
            >
                <Minus className="h-4 w-4" />
            </Button>
            <Input
                type="number"
                value={value}
                onChange={handleInputChange}
                className="w-20 text-center"
                min={min}
                max={max}
                step={step}
            />
            <Button
                variant="outline"
                size="icon"
                onClick={handleIncrement}
                disabled={value >= max}
                aria-label="Increase quantity"
            >
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    )
}

