'use client' // Error boundaries must be Client Components
import { LocalizedText } from "@/i18n/localized-text";

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error)
    }, [error])

    return (
        <div>
            <h2><LocalizedText text={"Something went wrong!"} /></h2>
            <button
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
            > <LocalizedText text={"Try again"} /> </button>
        </div>
    )
}
