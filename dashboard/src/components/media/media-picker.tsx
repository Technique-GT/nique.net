"use client"

import { useMemo, useState, forwardRef } from "react"
import { ImageIcon, X, Loader2, Search, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { VirtuosoGrid } from 'react-virtuoso'
import { useInfiniteMedia } from "@/hooks/use-queries"

export type MediaItem = {
  id: string
  title: string
  url: string
  description?: string
}

type MediaPickerProps = {
  value?: string
  // Items are now optional as we fetch internally, but kept for backward compat if needed
  items?: MediaItem[] 
  onChange: (mediaId: string | null) => void
  placeholder?: string
  className?: string
  error?: boolean
}

export function MediaPicker({
  value,
  onChange,
  placeholder = "Select media",
  className,
  error = false,
}: MediaPickerProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set())

  // Fetch media internally using infinite query
  const { 
    data: mediaData, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfiniteMedia({ search: searchTerm, limit: 20 })

  const allMediaItems = useMemo(() => {
    return mediaData?.pages.flatMap((page) => 
      page.data.map((item: any) => ({
        id: item._id,
        title: item.altText || 'Untitled',
        url: item.url,
        description: item.altText
      }))
    ) ?? []
  }, [mediaData])

  const selectedItem = useMemo(
    () => allMediaItems.find((item) => item.id === value) ?? null,
    [allMediaItems, value]
  )

  const handleSelect = (itemId: string) => {
    onChange(itemId)
    setOpen(false)
  }

  const handleClear = (event: React.MouseEvent<HTMLSpanElement>) => {
    event.stopPropagation()
    onChange(null)
  }

  const handleImageError = (id: string) => {
    setBrokenImages((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={error}
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
                        onError={() => handleImageError(selectedItem.id)}
                      />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col text-left flex-1">
                    <span className="truncate text-sm font-medium">
                      {selectedItem.title}
                    </span>
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
            {selectedItem && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Clear selected media"
              >
                <X className="h-3 w-3" />
              </span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Select Media</DialogTitle>
          </DialogHeader>
          
          <div className="p-4 border-b">
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

          <div className="flex-1 overflow-hidden p-4 min-h-0 bg-background">
            {isLoading ? (
               <div className="flex h-full items-center justify-center">
                 <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
               </div>
            ) : allMediaItems.length === 0 ? (
               <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                 <ImageIcon className="h-12 w-12 opacity-20 mb-2" />
                 <p>No media found</p>
               </div>
            ) : (
              <VirtuosoGrid
                style={{ height: '100%', width: '100%' }}
                totalCount={allMediaItems.length}
                data={allMediaItems}
                endReached={() => {
                   if (hasNextPage && !isFetchingNextPage) {
                     fetchNextPage()
                   }
                }}
                components={{
                  List: forwardRef(({ style, children, ...props }: any, ref) => (
                    <div
                      ref={ref}
                      {...props}
                      style={style}
                      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                    >
                      {children}
                    </div>
                  )),
                  Footer: () => (
                    isFetchingNextPage ? (
                      <div className="col-span-full flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : null
                  )
                }}
                itemContent={(index, item) => {
                  void index; // suppress unused var warning
                  const isSelected = item.id === value
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "group relative aspect-square rounded-lg border bg-muted cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-primary hover:ring-offset-2",
                        isSelected && "ring-2 ring-primary ring-offset-2"
                      )}
                      onClick={() => handleSelect(item.id)}
                    >
                       {brokenImages.has(item.id) ? (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground opacity-50" />
                          </div>
                        ) : (
                          <img
                            src={item.url}
                            alt={item.title}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            loading="lazy"
                            decoding="async"
                            onError={() => handleImageError(item.id)}
                          />
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-8 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-end">
                            <span className="text-xs text-white truncate w-full">{item.title}</span>
                            {isSelected && <div className="bg-primary text-primary-foreground rounded-full p-0.5 absolute top-2 right-2 opacity-100"><Check className="w-3 h-3" /></div>}
                        </div>
                         {isSelected && <div className="bg-primary text-primary-foreground rounded-full p-1 absolute top-2 right-2 shadow-sm"><Check className="w-3 h-3" /></div>}
                    </div>
                  )
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
