"use client"

import { useState, useEffect } from "react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface TypewriterTextProps {
    text: string
    speed?: number // ms per character
    onComplete?: () => void
    className?: string
    isMarkdown?: boolean
}

export function TypewriterText({
    text,
    speed = 15,
    onComplete,
    className,
    isMarkdown = true
}: TypewriterTextProps) {
    const [displayedText, setDisplayedText] = useState("")
    const [isComplete, setIsComplete] = useState(false)

    useEffect(() => {
        // Reset when text changes
        setDisplayedText("")
        setIsComplete(false)

        if (!text) return

        let currentIndex = 0
        const intervalId = setInterval(() => {
            if (currentIndex < text.length) {
                // Add characters in small chunks for smoother rendering
                const chunkSize = Math.min(3, text.length - currentIndex)
                setDisplayedText(text.slice(0, currentIndex + chunkSize))
                currentIndex += chunkSize
            } else {
                setIsComplete(true)
                clearInterval(intervalId)
                onComplete?.()
            }
        }, speed)

        return () => clearInterval(intervalId)
    }, [text, speed, onComplete])

    if (isMarkdown) {
        return (
            <div className={className}>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
                                {children}
                            </a>
                        ),
                        code: ({ children }) => (
                            <code className="px-1 py-0.5 bg-muted rounded text-[13px]">{children}</code>
                        ),
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    }}
                >
                    {displayedText}
                </ReactMarkdown>
                {!isComplete && (
                    <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse ml-0.5" />
                )}
            </div>
        )
    }

    return (
        <span className={className}>
            {displayedText}
            {!isComplete && (
                <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse ml-0.5" />
            )}
        </span>
    )
}
