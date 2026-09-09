import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { EditorView } from '@tiptap/pm/view'
import type { BlockRange } from './types'

export function blockRangeAtPosition(doc: ProseMirrorNode, position: number): BlockRange | null {
  let result: BlockRange | null = null

  doc.descendants((node, pos) => {
    if (node.type.name !== 'blockContainer') return
    const to = pos + node.nodeSize
    if (pos <= position && position <= to) result = { from: pos, to, node }
  })

  return result
}

export function selectedBlockRange(view: EditorView, dragged: BlockRange): BlockRange {
  const { doc, selection } = view.state
  const draggedBlockIsSelected = selection.from < dragged.to && selection.to > dragged.from
  if (selection.empty || !draggedBlockIsSelected) {
    return dragged
  }

  const $from = doc.resolve(selection.from)
  const $to = doc.resolve(selection.to)
  let sharedGroupDepth = 0
  const sharedDepth = Math.min($from.depth, $to.depth)
  for (let depth = 0; depth <= sharedDepth; depth += 1) {
    if ($from.node(depth) !== $to.node(depth)) break
    if (depth === 0 || $from.node(depth).type.name === 'blockGroup') sharedGroupDepth = depth
  }

  const blockDepth = sharedGroupDepth + 1
  if (blockDepth > $from.depth || blockDepth > $to.depth) return dragged
  const firstNode = $from.node(blockDepth)
  const lastNode = $to.node(blockDepth)
  if (firstNode.type.name !== 'blockContainer' || lastNode.type.name !== 'blockContainer') return dragged

  const firstFrom = $from.before(blockDepth)
  const lastFrom = $to.before(blockDepth)
  const from = Math.min(firstFrom, lastFrom)
  const to = Math.max(firstFrom + firstNode.nodeSize, lastFrom + lastNode.nodeSize)
  if (firstFrom === lastFrom) return dragged
  if (dragged.from < from || dragged.to > to) {
    return dragged
  }

  return {
    from,
    to,
    node: dragged.node,
  }
}
