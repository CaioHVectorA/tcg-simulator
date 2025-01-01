import { useEffect, useRef, useState } from "react";
// initialTime is in MS
export function Timer({
    initialTime
}: { initialTime: number }) {
    const [time, setTime] = useState<{ seconds: number, minutes: number, hours: number }>(() => {
        const seconds = Math.floor((initialTime / 1000) % 60)
        const minutes = Math.floor((initialTime / (1000 * 60)) % 60)
        const hours = Math.floor((initialTime / (1000 * 60 * 60)) % 24)
        return { seconds, minutes, hours }
    })
    const intervalRef = useRef<number>()

    const startTimer = () => {
        intervalRef.current = window.setInterval(() => {
            setTime((prev) => {
                if (prev.seconds === 0 && prev.minutes === 0 && prev.hours === 0) {
                    clearInterval(intervalRef.current)
                    return prev
                }
                if (prev.seconds === 0) {
                    if (prev.minutes === 0) {
                        return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
                    }
                    return { hours: prev.hours, minutes: prev.minutes - 1, seconds: 59 }
                }
                return { ...prev, seconds: prev.seconds - 1 }
            })
        }, 1000)
    }
    useEffect(() => {
        startTimer()
        return () => clearInterval(intervalRef.current)
    }, [])
    return (
        <>
            <>{time.hours} : {time.minutes} : {time.seconds}</>
        </>
    )
}