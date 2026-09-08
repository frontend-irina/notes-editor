import { Node } from '@tiptap/core'
import { Fragment, NodeRange, Slice } from '@tiptap/pm/model'
import { TextSelection } from '@tiptap/pm/state'
import type { Transaction } from '@tiptap/pm/state'
import { canJoin, liftTarget, ReplaceAroundStep } from '@tiptap/pm/transform'
import { defaultBlockProps } from '../../types'
import { uuidV7 } from '../../uuid'

function getBlockDepth($from: TextSelection['$from']) {
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name === 'blockContainer') return depth
  }
  return -1
}

// Adapted to the blockContainer/blockGroup schema from BlockNote's liftItem.
function liftToOuterGroup(transaction: Transaction, range: NodeRange) {
  const itemType = transaction.doc.type.schema.nodes.blockContainer
  const groupType = transaction.doc.type.schema.nodes.blockGroup
  const end = range.end
  const endOfGroup = range.$to.end(range.depth)

  if (end < endOfGroup) {
    const blockBeingLifted = range.parent.child(range.endIndex - 1)
    const hasChildren = blockBeingLifted.lastChild?.type === groupType

    transaction.step(new ReplaceAroundStep(
      end - (hasChildren ? 2 : 1),
      endOfGroup,
      end,
      endOfGroup,
      new Slice(Fragment.from(itemType.create(null, groupType.create())), hasChildren ? 2 : 1, 0),
      hasChildren ? 0 : 1,
      true,
    ))

    range = new NodeRange(
      transaction.doc.resolve(range.$from.pos),
      transaction.doc.resolve(endOfGroup),
      range.depth,
    )
  }

  const target = liftTarget(range)
  if (target === null) return false

  transaction.lift(range, target)
  const joinPosition = transaction.mapping.map(end, -1) - 1
  const $join = transaction.doc.resolve(joinPosition)
  if (
    canJoin(transaction.doc, joinPosition)
    && $join.nodeBefore?.type === $join.nodeAfter?.type
  ) {
    transaction.join(joinPosition)
  }
  transaction.scrollIntoView()
  return true
}

function unnestEmptyParagraph(transaction: Transaction) {
  const { $from, $to } = transaction.selection
  const range = $from.blockRange(
    $to,
    (node) => node.childCount > 0 && node.type.name === 'blockGroup',
  )

  if (!range) return false
  if ($from.node(range.depth - 1).type.name !== 'blockContainer') return false
  return liftToOuterGroup(transaction, range)
}

export const Paragraph = Node.create({
  name: 'paragraph',
  group: 'blockContent',
  content: 'inline*',
  defining: true,
  parseHTML: () => [{ tag: 'p' }],
  renderHTML: ({ HTMLAttributes }) => ['p', HTMLAttributes, 0],

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { state, view } = this.editor
        const { selection } = state
        if (!(selection instanceof TextSelection) || !selection.$from.sameParent(selection.$to)) {
          return false
        }

        const { $from, $to } = selection
        if ($from.parent.type !== this.type) return false

        const blockDepth = getBlockDepth($from)
        if (blockDepth < 0) return false

        const block = $from.node(blockDepth)
        const paragraph = block.firstChild
        if (paragraph?.type !== this.type) return false

        const isEmpty = paragraph.content.size === 0
        const isNested = blockDepth > 1
        if (isEmpty && isNested) {
          const transaction = state.tr
          if (!unnestEmptyParagraph(transaction)) return false
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
          this.type.create(null, before),
          block.marks,
        )
        const nextBlock = blockType.create(
          nextAttributes,
          [
            this.type.create(null, after),
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
      },
      'Mod-Alt-0': () => this.editor.chain().setNode(this.name).run(),
    }
  },
})
