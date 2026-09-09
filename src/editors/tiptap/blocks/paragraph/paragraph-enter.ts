import type { Editor } from '@tiptap/core'
import type { NodeType } from '@tiptap/pm/model'
import { TextSelection } from '@tiptap/pm/state'
import { defaultBlockProps } from '../../types'
import { uuidV7 } from '../../uuid'
import { getBlockDepth } from '../shared/block-position'
import { unnestEmptyBlock } from '../shared/unnest-block'

export function handleParagraphEnter(editor: Editor, type: NodeType) {
  const { state, view } = editor
  const { selection } = state
  if (!(selection instanceof TextSelection) || !selection.$from.sameParent(selection.$to)) {
    return false
  }

  const { $from, $to } = selection
  if ($from.parent.type !== type) return false

  const blockDepth = getBlockDepth($from)
  if (blockDepth < 0) return false

  const block = $from.node(blockDepth)
  const paragraph = block.firstChild
  if (paragraph?.type !== type) return false

  const isEmpty = paragraph.content.size === 0
  const isNested = blockDepth > 1
  if (isEmpty && isNested) {
    const transaction = state.tr
    if (!unnestEmptyBlock(transaction)) return false
    view.dispatch(transaction)
    return true
  }

  const fromOffset = $from.parentOffset
  const toOffset = $to.parentOffset
  const before = paragraph.content.cut(0, fromOffset)
  const after = paragraph.content.cut(toOffset)
  const childGroup = block.childCount > 1 ? block.child(1) : null
  const blockType = state.schema.nodes.blockContainer

  // BlockNote preserves compatible props for a split at the beginning.
  // Other newly-created paragraphs receive the schema defaults.
  const nextAttributes = fromOffset === 0 && !isEmpty
    ? { ...block.attrs, id: uuidV7() }
    : { ...defaultBlockProps, id: uuidV7() }

  const currentBlock = blockType.create(
    block.attrs,
    type.create(null, before),
    block.marks,
  )
  const nextBlock = blockType.create(
    nextAttributes,
    [
      type.create(null, after),
      ...(childGroup ? [childGroup] : []),
    ],
  )
  const blockPosition = $from.before(blockDepth)
  const transaction = state.tr.replaceWith(
    blockPosition,
    blockPosition + block.nodeSize,
    [currentBlock, nextBlock],
  )
  const nextTextPosition = blockPosition + currentBlock.nodeSize + 2

  view.dispatch(transaction.setSelection(
    TextSelection.near(transaction.doc.resolve(nextTextPosition)),
  ).scrollIntoView())
  return true
}
