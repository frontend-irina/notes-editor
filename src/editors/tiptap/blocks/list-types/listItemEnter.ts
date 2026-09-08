import type { Editor } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import { defaultBlockProps } from '../../types'
import { uuidV7 } from '../../uuid'

function getBlockDepth($from: TextSelection['$from']) {
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name === 'blockContainer') return depth
  }
  return -1
}

export function handleListItemEnter(editor: Editor, listItemType: string) {
  const { state, view } = editor
  const { selection } = state
  if (!(selection instanceof TextSelection) || !selection.empty) return false

  const { $from } = selection
  if ($from.parent.type.name !== listItemType) return false

  const blockDepth = getBlockDepth($from)
  if (blockDepth < 0) return false

  const block = $from.node(blockDepth)
  const listItem = block.firstChild
  if (!listItem || listItem.type.name !== listItemType) return false

  if (listItem.content.size === 0) {
    const paragraph = state.schema.nodes.paragraph.create()
    const replacement = state.schema.nodes.blockContainer.create(
      { ...defaultBlockProps, id: block.attrs.id },
      [paragraph, ...(block.childCount > 1 ? [block.child(1)] : [])],
    )
    const blockPosition = $from.before(blockDepth)
    view.dispatch(state.tr.replaceWith(
      blockPosition,
      blockPosition + block.nodeSize,
      replacement,
    ))
    return true
  }

  const offset = $from.parentOffset
  const before = listItem.content.cut(0, offset)
  const after = listItem.content.cut(offset)
  const blockType = state.schema.nodes.blockContainer
  const currentBlock = blockType.create(
    block.attrs,
    listItem.type.create(listItem.attrs, before),
    block.marks,
  )
  const nextBlock = blockType.create(
    { ...defaultBlockProps, id: uuidV7() },
    [
      listItem.type.create(null, after),
      ...(block.childCount > 1 ? [block.child(1)] : []),
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
