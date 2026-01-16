import { useEffect, useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { X } from "lucide-react"

type TagInputProps = {
  id?: string
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
  inputClassName?: string
  disabled?: boolean
  normalizeTag?: (tag: string) => string
}

export function TagInput({
  id,
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
  disabled,
  normalizeTag = (tag: string) => tag.toLowerCase(),
}: TagInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [inputValue, setInputValue] = useState("")

  useEffect(() => {
    if (!inputRef.current) {
      return
    }

    const updateWidth = () => {
      if (!inputRef.current) {
        return
      }

      const mirror = document.createElement("span")
      mirror.textContent = inputValue || placeholder || ""
      mirror.style.position = "absolute"
      mirror.style.visibility = "hidden"
      mirror.style.whiteSpace = "pre"
      mirror.style.font = window.getComputedStyle(inputRef.current).font
      document.body.append(mirror)
      const width = mirror.offsetWidth + 16
      mirror.remove()
      inputRef.current.style.width = `${Math.min(Math.max(width, 40), 240)}px`
    }

    updateWidth()
  }, [inputValue, placeholder, value])

  const addTag = (tag: string) => {
    const cleaned = tag.trim()

    if (!cleaned) {
      return
    }

    const normalized = normalizeTag(cleaned)

    if (!value.includes(normalized)) {
      onChange([...value, normalized])
    }

    setInputValue("")
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) {
      return
    }

    if (event.key === "Enter" || event.key === "Tab" || event.key === ",") {
      event.preventDefault()
      addTag(inputValue)
    }

    if (event.key === "Backspace" && inputValue === "") {
      const lastTag = value.length > 0 ? value[value.length - 1] : undefined
      if (lastTag) {
        removeTag(lastTag)
      }
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-10 flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 text-xs text-muted-foreground transition-colors hover:text-destructive duration-300"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="size-3" />
            </button>
          )}
        </Badge>
      ))}
      <Input
        id={id}
        ref={inputRef}
        className={cn(
          "h-auto w-16 flex-1 border-none p-0 text-sm shadow-none focus-visible:outline-none focus-visible:ring-0",
          inputClassName,
        )}
        value={inputValue}
        disabled={disabled}
        placeholder={value.length === 0 ? placeholder : undefined}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(inputValue)}
      />
    </div>
  )
}
