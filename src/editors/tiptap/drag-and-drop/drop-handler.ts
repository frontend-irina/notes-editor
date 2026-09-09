import { Selection } from '@tiptap/pm/state'
import { Slice } from '@tiptap/pm/model'
import { dropPoint } from '@tiptap/pm/transform'
import type { EditorView } from '@tiptap/pm/view'
import { getActiveDrag } from './drag-session'

function sliceForView(view: EditorView) {
  const drag = getActiveDrag()
  if (!drag) return null
  if (drag.source === view) return drag.slice
  try {
    const slice = Slice.fromJSON(view.state.schema, drag.slice.toJSON())
    slice.content.forEach(node => node.check())
    return slice
  } catch {
    return null
  }
}

export function dropPosition(view: EditorView, event: DragEvent) {
  const slice = sliceForView(view)
  if (!slice) return null
  const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
  if (!coordinates) return null
  return dropPoint(view.state.doc, coordinates.pos, slice)
}

export function handleDrop(view: EditorView, event: DragEvent, clearDrag: (view: EditorView) => void) {
  const activeDrag = getActiveDrag()
  if (!activeDrag || !view.editable) return false
  const target = dropPosition(view, event)
  if (target === null) return false
  const slice = sliceForView(view)
  if (!slice) return false
  event.preventDefault()

  const drag = activeDrag
  if (drag.source === view) {
    if (target >= drag.from && target <= drag.to) {
      clearDrag(view)
      return true
    }
    const transaction = view.state.tr.delete(drag.from, drag.to)
    const mappedTarget = transaction.mapping.map(target)
    transaction.replaceRange(mappedTarget, mappedTarget, drag.slice)
    transaction.setSelection(Selection.near(transaction.doc.resolve(mappedTarget), 1))
    view.dispatch(transaction.scrollIntoView())
  } else {
    const transaction = view.state.tr.replaceRange(target, target, slice)
    transaction.setSelection(Selection.near(transaction.doc.resolve(target), 1))
    view.dispatch(transaction.scrollIntoView())
    drag.source.dispatch(drag.source.state.tr.delete(drag.from, drag.to))
  }
  clearDrag(view)
  return true
}
