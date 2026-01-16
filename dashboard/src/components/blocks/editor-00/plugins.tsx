import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"

import { CharacterCountPlugin } from "@/components/editor/plugins/character-count"
import { ContentEditable } from "@/components/editor/editor-ui/content-editable"

import { ToolbarPlugin } from "./toolbar"

export function Plugins() {
  return (
    <div className="relative">
      <ToolbarPlugin />
      <RichTextPlugin
        contentEditable={
          <div>
            <ContentEditable placeholder={"Enter content body..."} className="ContentEditable__root relative block h-96 overflow-auto px-8 py-4 focus:outline-none" />
          </div>
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <ListPlugin />
      <LinkPlugin />
      <CharacterCountPlugin />
    </div>
  )
}
