import type { Editor } from '@tiptap/core'
import { useRef, useState, type MouseEvent } from 'react'
import type { SelectableBlockType, SelectedBlockType } from './types'

export function useBlockTypeSelect(editor: Editor, selectedType: SelectedBlockType) {
  const [anchorPosition, setAnchorPosition] = useState<{ top: number; left: number } | null>(null)
  const [menuContainer, setMenuContainer] = useState<HTMLElement | null>(null)
  const selection = useRef<{ from: number; to: number } | null>(null)

  const setBlockType = (type: SelectableBlockType) => {
    if (selectedType === type) {
      setAnchorPosition(null)
      setMenuContainer(null)
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
    setAnchorPosition(null)
    setMenuContainer(null)
  }

  const openMenu = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    selection.current = {
      from: editor.state.selection.from,
      to: editor.state.selection.to,
    }
    setAnchorPosition({ top: rect.bottom, left: rect.left })
    setMenuContainer(event.currentTarget.closest('.tiptap-toolbar-layer')?.parentElement ?? null)
  }

  const closeMenu = () => {
    setAnchorPosition(null)
    setMenuContainer(null)
  }
  return { anchorPosition, menuContainer, openMenu, closeMenu, setBlockType }
}
