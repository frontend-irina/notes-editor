import type { EditorView } from '@tiptap/pm/view'
import type { ActiveDrag, BlockRange } from './types'
import { selectedBlockRange } from './block-range'
import { createPreview, serializeRange } from './drag-transfer'

const internalMimeType = 'blocknote/html'
// Shared across editor instances to preserve cross-editor moves.
let activeDrag: ActiveDrag | null = null

export function getActiveDrag(): Readonly<ActiveDrag> | null {
  return activeDrag
}

export function endDrag() {
  activeDrag?.preview?.remove()
  activeDrag = null
}

export function startDrag(view: EditorView, event: DragEvent, blockId: string) {
  if (!event.dataTransfer || !view.editable) return

  let dragged: BlockRange | null = null
  view.state.doc.descendants((node, pos) => {
    if (node.type.name === 'blockContainer' && node.attrs.id === blockId) {
      dragged = { from: pos, to: pos + node.nodeSize, node }
      return false
    }
  })
  if (!dragged) return

  const range = selectedBlockRange(view, dragged)
  const slice = view.state.doc.slice(range.from, range.to)
  const preview = createPreview(view, range)
  const serialized = serializeRange(view, range)

  activeDrag = { ...range, source: view, slice, preview }
  event.dataTransfer.clearData()
  event.dataTransfer.setData(internalMimeType, serialized.html)
  event.dataTransfer.setData('text/html', serialized.html)
  event.dataTransfer.setData('text/plain', serialized.text)
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setDragImage(preview, 0, 0)
}
