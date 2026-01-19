import { JSX, useEffect, useRef, useState } from "react"
import { ContentEditable as LexicalContentEditable } from "@lexical/react/LexicalContentEditable"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getRoot } from "lexical"

type Props = {
  placeholder: string
  className?: string
}

export function ContentEditable({
  placeholder,
  className,
}: Props): JSX.Element {
  const [editor] = useLexicalComposerContext()
  const [isEmpty, setIsEmpty] = useState(true)
  isEmpty;
  const editableRef = useRef<HTMLDivElement | null>(null)
  const [_, setOffsets] = useState({
    top: "0px",
    left: "0px",
    right: "0px",
  })

  useEffect(() => {
    const checkIfEmpty = () => {
      const currentState = editor.getEditorState()
      currentState.read(() => {
        const root = $getRoot()
        setIsEmpty(root.getTextContent().trim().length === 0)
      })
    }

    checkIfEmpty()
    const unregister = editor.registerUpdateListener(() => {
      checkIfEmpty()
    })

    return () => {
      unregister()
    }
  }, [editor])

  useEffect(() => {
    const node = editableRef.current
    if (!node) {
      return
    }

    const updateOffsets = () => {
      const styles = window.getComputedStyle(node)
      setOffsets({
        top: styles.paddingTop,
        left: styles.paddingLeft,
        right: styles.paddingRight,
      })
    }

    updateOffsets()
    window.addEventListener("resize", updateOffsets)

    return () => {
      window.removeEventListener("resize", updateOffsets)
    }
  }, [])

  // const placeholderStyle = useMemo(
  //   () => ({
  //     marginTop: top,
  //     paddingLeft: left,
  //     paddingRight: right,
  //   }),
  //   [top, left, right],
  // )

  return (
      <LexicalContentEditable
        ref={editableRef}
        className={
          className ??
          `ContentEditable__root relative block min-h-full overflow-auto px-8 py-4 focus:outline-none`
        }
        aria-placeholder={placeholder}
        placeholder={(isEditable: boolean) => {isEditable; return null;}}
      />
  )
}
