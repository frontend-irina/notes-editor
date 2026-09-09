import type { Editor } from '@tiptap/core'
import { useRef, useState, type MouseEvent } from 'react'
import type { SelectableBlockType, SelectedBlockType } from './types'

export function useBlockTypeSelect(editor: Editor, selectedType: SelectedBlockType) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const selection = useRef<{ from: number; to: number } | null>(null)

  const setBlockType = (type: SelectableBlockType) => {
    if (selectedType === type) {
      setAnchor(null)
      return
    }

    const chain = editor.chain().focus()
    if (selection.current) chain.setTextSelection(selection.current)
    if (type.startsWith('heading-')) {
      chain.setNode('heading', { level: Number(type.slice('heading-'.length)) })
    } else {
      chain.setNode(type)
    }
    if (type === 'quote') chain.updateAttributes('blockContainer', { textAlignment: 'left' })
    chain.run()
    setAnchor(null)
  }

  const openMenu = (event: MouseEvent<HTMLButtonElement>) => {
    selection.current = {
      from: editor.state.selection.from,
      to: editor.state.selection.to,
    }
    setAnchor(event.currentTarget)
  }

  const closeMenu = () => setAnchor(null)
  return { anchor, openMenu, closeMenu, setBlockType }
}
