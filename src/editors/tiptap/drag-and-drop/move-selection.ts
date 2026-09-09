import type { EditorView } from '@tiptap/pm/view'
import { blockRangeAtPosition } from './block-range'

export function moveSelection(view: EditorView, direction: -1 | 1) {
  const { doc, selection } = view.state
  const current = blockRangeAtPosition(doc, selection.from)
  if (!current) return false

  const $from = doc.resolve(current.from)
  const parent = $from.parent
  const index = $from.index()
  const siblingIndex = index + direction
  if (siblingIndex < 0 || siblingIndex >= parent.childCount) return false

  let siblingFrom = $from.start()
  for (let currentIndex = 0; currentIndex < siblingIndex; currentIndex += 1) {
    siblingFrom += parent.child(currentIndex).nodeSize
  }
  const target = direction < 0 ? siblingFrom : siblingFrom + parent.child(siblingIndex).nodeSize
  const slice = doc.slice(current.from, current.to)
  const transaction = view.state.tr.delete(current.from, current.to)
  const mappedTarget = transaction.mapping.map(target)
  transaction.replaceRange(mappedTarget, mappedTarget, slice)
  view.dispatch(transaction.scrollIntoView())
  return true
}
