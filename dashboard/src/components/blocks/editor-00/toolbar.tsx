"use client"

import type { ReactNode } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { mergeRegister } from "@lexical/utils"
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical"
import type { HeadingTagType } from "@lexical/rich-text"
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
} from "@lexical/rich-text"
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListItemNode,
  $isListNode,
} from "@lexical/list"
import {
  TOGGLE_LINK_COMMAND,
  $isLinkNode,
} from "@lexical/link"
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
  $setBlocksType,
} from "@lexical/selection"
import type { LexicalNode, TextNode } from "lexical"
import { ElementNode } from "lexical"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Subscript,
  Superscript,
  Underline,
  Undo2,
} from "lucide-react"

type BlockType =
  | "paragraph"
  | "quote"
  | "h1"
  | "h2"
  | "h3"
  | "bullet"
  | "number"

type ElementFormat = "left" | "center" | "right" | "justify" | "start" | "end" | "" | null

type ToolbarButtonProps = {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  label: string
  children: ReactNode
}

const FONT_FAMILIES = [
  { label: "Default", value: "default" },
  { label: "Sans", value: "Arial, sans-serif" },
  { label: "Serif", value: "Times New Roman, serif" },
  { label: "Mono", value: "ui-monospace, SFMono-Regular, Menlo, Monaco" },
]

const FONT_SIZES = [
  "12px",
  "14px",
  "16px",
  "18px",
  "24px",
  "32px",
]

const BLOCK_OPTIONS: Array<{ label: string; value: BlockType; icon?: ReactNode }> = [
  { label: "Paragraph", value: "paragraph", icon: <Pilcrow className="h-4 w-4" /> },
  { label: "Heading 1", value: "h1", icon: <Heading1 className="h-4 w-4" /> },
  { label: "Heading 2", value: "h2", icon: <Heading2 className="h-4 w-4" /> },
  { label: "Heading 3", value: "h3", icon: <Heading3 className="h-4 w-4" /> },
  { label: "Quote", value: "quote", icon: <Quote className="h-4 w-4" /> },
  { label: "Bullet List", value: "bullet", icon: <List className="h-4 w-4" /> },
  { label: "Numbered List", value: "number", icon: <ListOrdered className="h-4 w-4" /> },
]

function normalizeColor(color: string): string {
  if (!color) {
    return "#000000"
  }

  if (color.startsWith("#")) {
    const hex = color.length === 4
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color
    return hex.toLowerCase()
  }

  const match = color
    .replace(/\s+/g, "")
    .match(/^rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)$/i)

  if (match) {
    const [, r, g, b] = match
    const toHex = (value: string) => {
      const num = Math.max(0, Math.min(255, Number(value)))
      return num.toString(16).padStart(2, "0")
    }

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  return "#000000"
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "ghost"}
      size="icon"
      aria-pressed={active}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

function getSelectedBlockType(block: LexicalNode | null): BlockType {
  if (block === null) {
    return "paragraph"
  }

  if ($isListItemNode(block)) {
    const parent = block.getParent()
    if ($isListNode(parent)) {
      const listType = parent.getListType()
      return listType === "number" ? "number" : "bullet"
    }
  }

  if ($isListNode(block)) {
    const listType = block.getListType()
    return listType === "number" ? "number" : "bullet"
  }

  if ($isHeadingNode(block)) {
    return block.getTag() as BlockType
  }

  if ($isQuoteNode(block)) {
    return "quote"
  }

  return "paragraph"
}

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext()

  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [isSubscript, setIsSubscript] = useState(false)
  const [isSuperscript, setIsSuperscript] = useState(false)
  const [blockType, setBlockType] = useState<BlockType>("paragraph")
  const [elementFormat, setElementFormat] = useState<ElementFormat>("left")
  const [fontFamily, setFontFamily] = useState<string>("default")
  const [fontSize, setFontSize] = useState<string>("16px")
  const [fontColor, setFontColor] = useState<string>("#000000")
  const [isLinkSelected, setIsLinkSelected] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const applyStyleText = useCallback(
    (styles: Record<string, string>) => {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, styles)
        }
      })
    },
    [editor],
  )

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()

    if (!$isRangeSelection(selection)) {
      return
    }

    setIsBold(selection.hasFormat("bold"))
    setIsItalic(selection.hasFormat("italic"))
    setIsUnderline(selection.hasFormat("underline"))
    setIsStrikethrough(selection.hasFormat("strikethrough"))
    setIsSubscript(selection.hasFormat("subscript"))
    setIsSuperscript(selection.hasFormat("superscript"))

    const anchorNode = selection.anchor.getNode()
    const topLevelElement = anchorNode.getKey() === "root"
      ? anchorNode
      : anchorNode.getTopLevelElementOrThrow()

    setBlockType(getSelectedBlockType(topLevelElement))

    const formatElement = topLevelElement instanceof ElementNode
      ? topLevelElement
      : topLevelElement.getParent()

    setElementFormat(
      formatElement instanceof ElementNode
        ? (formatElement.getFormatType() as ElementFormat)
        : "left",
    )

    const currentFontColor = $getSelectionStyleValueForProperty(selection, "color", "#000000")
    setFontColor(normalizeColor(currentFontColor))

    const currentFontFamily = $getSelectionStyleValueForProperty(selection, "font-family", "")
    const sanitizedFamily = currentFontFamily.replace(/"/g, "")
    const normalizedFamily = FONT_FAMILIES.some((family) => family.value === sanitizedFamily)
      ? sanitizedFamily
      : "default"
    setFontFamily(normalizedFamily)

    const currentFontSize = $getSelectionStyleValueForProperty(selection, "font-size", "16px")
    const normalizedSize = FONT_SIZES.includes(currentFontSize) ? currentFontSize : "16px"
    setFontSize(normalizedSize)

    let node: TextNode | ElementNode | null = anchorNode
    let isLink = false
    while (node != null) {
      if ($isLinkNode(node)) {
        isLink = true
        break
      }
      node = node.getParent()
    }
    setIsLinkSelected(isLink)
  }, [])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar()
        })
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar()
          return false
        },
        1,
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload: boolean) => {
          setCanUndo(payload)
          return false
        },
        1,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload: boolean) => {
          setCanRedo(payload)
          return false
        },
        1,
      ),
    )
  }, [editor, updateToolbar])

  const applyBlockType = useCallback(
    (value: BlockType) => {
      if (value === "bullet") {
        if (blockType === "bullet") {
          editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
        } else {
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
        }
        return
      }

      if (value === "number") {
        if (blockType === "number") {
          editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
        } else {
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
        }
        return
      }

      editor.update(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) {
          return
        }

        $setBlocksType(selection, () => {
          if (value === "quote") {
            return $createQuoteNode()
          }

          if (value === "paragraph") {
            return $createParagraphNode()
          }

          return $createHeadingNode(value as HeadingTagType)
        })
      })
    },
    [editor, blockType],
  )

  const clearFormatting = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) {
        return
      }

      const textNodes = selection.getNodes().filter($isTextNode)

      textNodes.forEach((textNode) => {
        textNode.setFormat(0)
        textNode.setStyle("")
      })
    })
  }, [editor])

  const applyElementAlignment = useCallback(
    (format: Exclude<ElementFormat, null>) => {
      editor.dispatchCommand(
        FORMAT_ELEMENT_COMMAND,
        elementFormat === format ? "left" : format,
      )
    },
    [editor, elementFormat],
  )

  const toggleLink = useCallback(() => {
    if (isLinkSelected) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
      return
    }

    const url = window.prompt("Enter the URL") || ""
    if (url.trim() === "") {
      return
    }

    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
  }, [editor, isLinkSelected])

  const blockTypeLabel = useMemo(() => {
    return BLOCK_OPTIONS.find((option) => option.value === blockType)?.label ?? "Paragraph"
  }, [blockType])

  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-muted/50 p-2">
      <ToolbarButton
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        disabled={!canUndo}
        label="Undo"
      >
        <Undo2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        disabled={!canRedo}
        label="Redo"
      >
        <Redo2 className="h-4 w-4" />
      </ToolbarButton>

      <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />

      <Select value={blockType} onValueChange={(value) => applyBlockType(value as BlockType)}>
        <SelectTrigger className="w-40">
          <SelectValue>{blockTypeLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {BLOCK_OPTIONS.map(({ label, value, icon }) => (
            <SelectItem key={value} value={value} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                {icon}
                <span>{label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ToolbarButton
        onClick={() => applyElementAlignment("left")}
        active={elementFormat === "left" || elementFormat === "start" || elementFormat === ""}
        label="Align Left"
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => applyElementAlignment("center")}
        active={elementFormat === "center"}
        label="Align Center"
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => applyElementAlignment("right")}
        active={elementFormat === "right" || elementFormat === "end"}
        label="Align Right"
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => applyElementAlignment("justify")}
        active={elementFormat === "justify"}
        label="Justify"
      >
        <AlignJustify className="h-4 w-4" />
      </ToolbarButton>

      <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />

      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        active={isBold}
        label="Bold"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        active={isItalic}
        label="Italic"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        active={isUnderline}
        label="Underline"
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}
        active={isStrikethrough}
        label="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "subscript")}
        active={isSubscript}
        label="Subscript"
      >
        <Subscript className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "superscript")}
        active={isSuperscript}
        label="Superscript"
      >
        <Superscript className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton onClick={toggleLink} active={isLinkSelected} label="Insert link">
        <Link className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton onClick={clearFormatting} label="Clear formatting">
        <Eraser className="h-4 w-4" />
      </ToolbarButton>

      <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />

      <Select
        value={fontFamily}
        onValueChange={(value) => {
          setFontFamily(value)
          applyStyleText({ "font-family": value === "default" ? "" : value })
        }}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Font family" />
        </SelectTrigger>
        <SelectContent>
          {FONT_FAMILIES.map(({ label, value }) => (
            <SelectItem key={label} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={fontSize}
        onValueChange={(value) => {
          setFontSize(value)
          applyStyleText({ "font-size": value })
        }}
      >
        <SelectTrigger className="w-24">
          <SelectValue placeholder="Font size" />
        </SelectTrigger>
        <SelectContent>
          {FONT_SIZES.map((size) => (
            <SelectItem key={size} value={size}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        Color
        <Input
          type="color"
          value={fontColor}
          onChange={(event) => {
            const value = event.target.value
            setFontColor(value)
            applyStyleText({ color: value })
          }}
          className="h-8 w-16 p-1"
        />
      </label>
    </div>
  )
}
