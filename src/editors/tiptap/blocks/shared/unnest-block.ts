import { Fragment, NodeRange, Slice } from '@tiptap/pm/model'
import type { Transaction } from '@tiptap/pm/state'
import { canJoin, liftTarget, ReplaceAroundStep } from '@tiptap/pm/transform'

// Preserve the blockContainer/blockGroup structure when lifting a block.
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

export function unnestEmptyBlock(transaction: Transaction) {
  const { $from, $to } = transaction.selection
  const range = $from.blockRange(
    $to,
    (node) => node.childCount > 0 && node.type.name === 'blockGroup',
  )

  if (!range) return false
  if ($from.node(range.depth - 1).type.name !== 'blockContainer') return false
  return liftToOuterGroup(transaction, range)
}
