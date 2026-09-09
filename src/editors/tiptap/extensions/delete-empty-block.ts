import type { Editor } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import { getBlockDepth } from '../blocks/shared/block-position'

export function deleteEmptyBlockAndSelectPrevious(editor: Editor) {
  const { state, view } = editor
  const { selection } = state

  if (!(selection instanceof TextSelection) || !selection.empty) return false

  const { $from } = selection
  const blockDepth = getBlockDepth($from)
  if (blockDepth < 0) return false

  const block = $from.node(blockDepth)
  const blockContent = block.firstChild
  if (
    !blockContent
    || $from.parent !== blockContent
    || blockContent.content.size !== 0
  ) return false

  const parentDepth = blockDepth - 1
  const blockIndex = $from.index(parentDepth)

  // A block can only be removed when a previous sibling remains in the same
  // group. This also keeps the `blockContainer+` schema valid.
  if (blockIndex === 0) return false

  const blockPosition = $from.before(blockDepth)
  const transaction = state.tr.delete(
    blockPosition,
    blockPosition + block.nodeSize,
  )
  const previousBlockEnd = transaction.doc.resolve(blockPosition - 1)

  view.dispatch(
    transaction
      .setSelection(TextSelection.near(previousBlockEnd, -1))
      .scrollIntoView(),
  )
  return true
}
