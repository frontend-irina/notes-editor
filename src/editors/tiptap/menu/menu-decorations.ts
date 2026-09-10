import type { EditorState } from '@tiptap/pm/state'
import { Decoration, DecorationSet, type EditorView } from '@tiptap/pm/view'
import { openMenuForBlock } from './menu-commands'

function addBlockButton(view: EditorView, blockId: string) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'tiptap-add-block-button'
  button.title = 'Добавить блок'
  button.setAttribute('aria-label', 'Добавить блок')
  const icon = document.createElement('span')
  icon.className = 'tiptap-add-block-icon'
  icon.setAttribute('aria-hidden', 'true')
  button.append(icon)
  button.addEventListener('mousedown', (event) => {
    event.preventDefault()
    event.stopPropagation()
  })
  button.addEventListener('click', (event) => {
    event.stopPropagation()
    openMenuForBlock(view, blockId)
  })
  return button
}

export function menuDecorations(state: EditorState) {
  const decorations: Decoration[] = []
  state.doc.descendants((node, pos) => {
    if (node.type.name === 'blockContainer') {
      decorations.push(Decoration.widget(
        pos + 1,
        (view) => addBlockButton(view, String(node.attrs.id)),
        { side: -2, key: `add-block-${String(node.attrs.id)}` },
      ))
    }
  })
  return DecorationSet.create(state.doc, decorations)
}
