import type { Editor } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import { defaultBlockProps } from '../../types'
import { uuidV7 } from '../../uuid'
import { getBlockDepth } from '../shared/block-position'

export function handleQuoteEnter(editor: Editor) {
  const { state, view } = editor
  const { $from } = state.selection
  const blockDepth = getBlockDepth($from)
  if (blockDepth < 0) return false

  const block = $from.node(blockDepth)
  const blockContent = block.firstChild
  if (!blockContent || blockContent.type.name !== 'quote') return false

  const offset = $from.parentOffset
  const before = blockContent.content.cut(0, offset)
  const after = blockContent.content.cut(offset)
  const contentType = blockContent.type
  const blockType = state.schema.nodes.blockContainer
  const nextBlock = blockType.create(
    {
      ...defaultBlockProps,
      backgroundColor: block.attrs.backgroundColor,
      textColor: block.attrs.textColor,
      textAlignment: blockContent.type.name === 'quote' ? 'left' : block.attrs.textAlignment,
      id: uuidV7(),
    },
    contentType.create(null, after),
  )
  const currentBlock = blockType.create(
    block.attrs,
    [
      contentType.create(null, before),
      ...(block.childCount > 1 ? [block.child(1)] : []),
    ],
    block.marks,
  )
  const from = $from.before(blockDepth)
  const transaction = state.tr.replaceWith(
    from,
    from + block.nodeSize,
    [currentBlock, nextBlock],
  )
  const nextTextPosition = from + currentBlock.nodeSize + 2
  view.dispatch(
    transaction.setSelection(TextSelection.near(transaction.doc.resolve(nextTextPosition))),
  )
  return true
}
