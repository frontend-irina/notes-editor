import type { EditorState } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

function dragHandle(blockId: string) {
  const handle = document.createElement('button')
  handle.type = 'button'
  handle.className = 'tiptap-drag-handle'
  handle.draggable = true
  handle.dataset.blockId = blockId
  handle.title = 'Перетащить блок'
  handle.setAttribute('aria-label', 'Перетащить блок')
  handle.textContent = '⋮⋮'
  return handle
}

export function dragDecorations(state: EditorState, cursor: number | null | undefined) {
  const decorations: Decoration[] = []
  state.doc.descendants((node, pos) => {
    if (node.type.name === 'blockContainer') {
      decorations.push(Decoration.widget(
        pos + 1,
        () => dragHandle(String(node.attrs.id)),
        { side: -1, key: `drag-handle-${String(node.attrs.id)}` },
      ))
    }
  })
  if (typeof cursor === 'number') {
    decorations.push(Decoration.widget(cursor, () => {
      const element = document.createElement('div')
      element.className = 'tiptap-drop-cursor'
      return element
    }, { side: -1, key: 'block-drop-cursor' }))
  }
  return DecorationSet.create(state.doc, decorations)
}
