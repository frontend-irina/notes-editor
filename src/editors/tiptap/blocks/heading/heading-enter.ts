import type { Editor } from '@tiptap/core'
import type { NodeType } from '@tiptap/pm/model'
import { TextSelection } from '@tiptap/pm/state'
import { defaultBlockProps } from '../../types'
import { uuidV7 } from '../../uuid'
import { getBlockDepth } from '../shared/block-position'
import { unnestEmptyBlock } from '../shared/unnest-block'

export function handleHeadingEnter(editor: Editor, type: NodeType) {
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
  const heading = block.firstChild
  if (heading?.type !== type) return false

  const isEmpty = heading.content.size === 0
  if (isEmpty && blockDepth > 1) {
    const transaction = state.tr
    if (!unnestEmptyBlock(transaction)) return false
    view.dispatch(transaction)
    return true
  }

  const fromOffset = $from.parentOffset
  const toOffset = $to.parentOffset
  const before = heading.content.cut(0, fromOffset)
  const after = heading.content.cut(toOffset)
  const childGroup = block.childCount > 1 ? block.child(1) : null
  const blockType = state.schema.nodes.blockContainer
  const paragraphType = state.schema.nodes.paragraph
  const keepHeading = fromOffset === 0 && !isEmpty
  const nextContent = keepHeading
    ? type.create({ level: heading.attrs.level }, after)
    : paragraphType.create(null, after)
  const nextAttributes = keepHeading
    ? { ...block.attrs, id: uuidV7() }
    : { ...defaultBlockProps, id: uuidV7() }
  const currentBlock = blockType.create(
    block.attrs,
    type.create({ level: heading.attrs.level }, before),
    block.marks,
  )
  const nextBlock = blockType.create(
    nextAttributes,
    [nextContent, ...(childGroup ? [childGroup] : [])],
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
