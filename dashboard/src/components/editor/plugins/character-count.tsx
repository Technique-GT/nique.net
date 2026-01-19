"use client"

import { useEffect, useMemo, useState } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"

import { cn } from "@/lib/utils"

type CharacterCountPluginProps = {
  className?: string
}

export function CharacterCountPlugin({ className }: CharacterCountPluginProps) {
  const [editor] = useLexicalComposerContext()
  const [text, setText] = useState("")

  useEffect(() => {
    return editor.registerTextContentListener((nextText) => {
      setText(nextText)
    })
  }, [editor])

  const { wordCount, charCount } = useMemo(() => {
    const trimmed = text.trim()
    return {
      wordCount: trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length,
      charCount: text.length,
    }
  }, [text])

  return (
    <div className="pointer-events-none absolute bottom-3 right-4">
      <div
        className={cn(
          "rounded bg-muted px-2 py-1 text-xs text-muted-foreground shadow-sm",
          className,
        )}
      >
        {wordCount} words • {charCount} characters
      </div>
    </div>
  )
}
