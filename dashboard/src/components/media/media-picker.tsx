"use client"

import { useCallback, useDeferredValue, useMemo, useState } from "react"
import { Check, ImageIcon, Loader2, Search } from "lucide-react"
import { Virtuoso } from "react-virtuoso"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useInfiniteMedia } from "@/hooks/use-queries"
import { cn } from "@/lib/utils"

export type MediaItem = {
  id: string
  title: string
  url: string
  description?: string
}

type MediaPickerProps = {
  value?: string
  // Optional legacy list for instant label display
  items?: MediaItem[]
  onChange: (mediaId: string | null) => void
  placeholder?: string
  className?: string
  error?: boolean
  disabled?: boolean
}

type BackendMedia = {
  _id: string
  url: string
  altText?: string
}

export function MediaPicker({
  value,
  items,
  onChange,
  placeholder = "Select media",
  className,
  error = false,
  disabled = false,
}: MediaPickerProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const deferredSearch = useDeferredValue(searchTerm)

  // For large originals (multi-MB), thumbnail grids will always be janky.
  // So the picker uses a fast virtualized *list* and loads at most one image
  // in the preview pane.
  const [activeId, setActiveId] = useState<string | null>(value ?? null)
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set())

  const {
    data: mediaData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteMedia({ search: deferredSearch, limit: 50 })

  const fetchedItems = useMemo<MediaItem[]>(() => {
    return (
      mediaData?.pages.flatMap((page) =>
        page.data.map((m: BackendMedia) => ({
          id: m._id,
          title: m.altText || "Untitled",
          url: m.url,
          description: m.altText,
        }))
      ) ?? []
    )
  }, [mediaData])

  const selectedItem = useMemo(() => {
    const inFetched = fetchedItems.find((i) => i.id === value) ?? null
    if (inFetched) return inFetched

    const inProvided = (items ?? []).find((i) => i.id === value) ?? null
    if (inProvided) return inProvided

    return null
  }, [fetchedItems, items, value])

  const activeItem = useMemo(() => {
    if (!activeId) return null
    return fetchedItems.find((i) => i.id === activeId) ?? (items ?? []).find((i) => i.id === activeId) ?? null
  }, [activeId, fetchedItems, items])

  const handleImageError = useCallback((id: string) => {
    setBrokenImages((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      setActiveId((prev) => prev ?? value ?? null)
    }
  }

  const handleConfirm = () => {
    onChange(activeId)
    setOpen(false)
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            aria-invalid={error}
            disabled={disabled}
            className={cn(
              "w-full justify-between h-auto py-2",
              error && "border-destructive focus-visible:ring-destructive"
            )}
          >
            <div className="flex min-w-0 items-center gap-3 w-full">
              {selectedItem ? (
                <>
                  <div className="relative size-10 shrink-0 rounded-md overflow-hidden bg-muted border">
                    {brokenImages.has(selectedItem.id) ? (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="size-5 text-muted-foreground opacity-50" />
                      </div>
                    ) : (
                      <img
                        src={selectedItem.url}
                        alt={selectedItem.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                        draggable={false}
                        onError={() => handleImageError(selectedItem.id)}
                      />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col text-left flex-1">
                    <span className="truncate text-sm font-medium">{selectedItem.title}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-md bg-muted border border-dashed">
                    <ImageIcon className="size-5 text-muted-foreground" />
                  </div>
                  <span className="text-muted-foreground">{placeholder}</span>
                </div>
              )}
            </div>
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[980px] h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Select Media</DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search media..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-5">
            {/* Left: fast list (no thumbnails) */}
            <div className="md:col-span-2 border-r min-h-0">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Virtuoso
                  style={{ height: "100%" }}
                  data={fetchedItems}
                  computeItemKey={(index, item) => {
                    void index
                    return item.id
                  }}
                  endReached={() => {
                    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
                  }}
                  itemContent={(index, item) => {
                    void index
                    const isActive = item.id === activeId
                    const isSelected = item.id === value
                    return (
                      <button
                        type="button"
                        className={cn(
                          "w-full px-4 py-3 text-left flex items-start gap-3 border-b",
                          "hover:bg-muted/50",
                          isActive && "bg-muted"
                        )}
                        onClick={() => setActiveId(item.id)}
                        onDoubleClick={() => {
                          setActiveId(item.id)
                          onChange(item.id)
                          setOpen(false)
                        }}
                      >
                        <div className={cn(
                          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border bg-background",
                          isActive ? "border-primary" : "border-muted-foreground/30"
                        )}>
                          {isSelected ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{item.title}</div>
                          <div className="truncate text-xs text-muted-foreground">{item.url.split("/").pop()}</div>
                        </div>
                      </button>
                    )
                  }}
                  components={{
                    Footer: () =>
                      isFetchingNextPage ? (
                        <div className="flex justify-center py-3">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : null,
                  }}
                />
              )}
            </div>

            {/* Right: single preview */}
            <div className="md:col-span-3 min-h-0 flex flex-col">
              <div className="flex-1 min-h-0 p-6">
                {!activeItem ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12 opacity-20 mb-2" />
                    <p>Select an item to preview</p>
                    <p className="text-xs mt-1">(Preview loads the full image)</p>
                  </div>
                ) : brokenImages.has(activeItem.id) ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12 opacity-20 mb-2" />
                    <p>Preview unavailable</p>
                  </div>
                ) : (
                  <div className="h-full flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-base font-medium">{activeItem.title}</div>
                        <div className="truncate text-xs text-muted-foreground">{activeItem.url}</div>
                      </div>
                      {activeItem.id === value && (
                        <span className="text-xs text-muted-foreground">Currently selected</span>
                      )}
                    </div>
                    <div className="flex-1 min-h-0 rounded-lg border bg-muted/20 overflow-hidden flex items-center justify-center">
                      <img
                        src={activeItem.url}
                        alt={activeItem.title}
                        className="max-h-full max-w-full object-contain"
                        decoding="async"
                        fetchPriority="low"
                        onError={() => handleImageError(activeItem.id)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t px-6 py-4 flex items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  Tip: double-click an item to select quickly.
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleConfirm}
                    disabled={!activeId}
                  >
                    Select
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
