"use client"

import { useMemo, useState } from "react"
import { ImageIcon, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type MediaItem = {
  id: string
  title: string
  url: string
  description?: string
}

type MediaPickerProps = {
  value?: string
  items: MediaItem[]
  onChange: (mediaId: string | null) => void
  placeholder?: string
  className?: string
  error?: boolean
}

export function MediaPicker({
  value,
  items,
  onChange,
  placeholder = "Select media",
  className,
  error = false,
}: MediaPickerProps) {
  const [open, setOpen] = useState(false)

  const selectedItem = useMemo(
    () => items.find((item) => item.id === value) ?? null,
    [items, value],
  )

  const handleSelect = (itemId: string) => {
    onChange(itemId)
    setOpen(false)
  }

  const handleClear = (event: React.MouseEvent<HTMLSpanElement>) => {
    event.stopPropagation()
    onChange(null)
    setOpen(false)
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={error}
            className={cn(
              "w-full justify-between",
              error && "border-destructive focus-visible:ring-destructive"
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              {selectedItem ? (
                <img
                  src={selectedItem.url}
                  alt={selectedItem.title}
                  className="size-6 rounded-md object-cover"
                />
              ) : (
                <div className="flex size-6 items-center justify-center rounded-md bg-muted">
                  <ImageIcon className="size-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex min-w-0 flex-col text-left">
                <span className="truncate text-sm font-medium">
                  {selectedItem ? selectedItem.title : placeholder}
                </span>
                {/* {selectedItem?.description && (
                  <span className="truncate text-xs text-muted-foreground">
                    {selectedItem.description}
                  </span>
                )} */}
              </div>
            </div>
            {selectedItem && (
              <span
                role="button"
                tabIndex={-1}
                onClick={handleClear}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground duration-300"
                aria-label="Clear selected media"
              >
                <X className="h-4 w-4" />
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search media..." />
            <CommandEmpty>No media found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.title}
                  onSelect={() => handleSelect(item.id)}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.url}
                      alt={item.title}
                      className="h-12 w-12 rounded-md object-cover"
                      loading="lazy"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{item.title}</span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedItem && (
        <div className="rounded-md border p-3 text-sm text-muted-foreground">
          <div className="mb-2 flex items-center gap-3">
            <img
              src={selectedItem.url}
              alt={selectedItem.title}
              className="size-40 rounded-md object-cover"
              loading="lazy"
            />
            <div>
              <p className="font-medium text-foreground">{selectedItem.title}</p>
              {selectedItem.description && <p>{selectedItem.description}</p>}
            </div>
          </div>
          <p className="truncate text-xs">
            <span className="font-medium">URL:</span> {selectedItem.url}
          </p>
        </div>
      )}
    </div>
  )
}
