import { Fragment, NodeRange, Slice } from '@tiptap/pm/model'
import type { EditorState, Transaction } from '@tiptap/pm/state'
import { ReplaceAroundStep } from '@tiptap/pm/transform'
import { MAX_BLOCK_DEPTH } from '../../types'
import { getBlockNestingDepth, getNodeBlockDepth } from './block-position'

function selectedBlockRange(state: EditorState): NodeRange | null {
  const { $from, $to } = state.selection
  return $from.blockRange(
    $to,
    (node) => node.childCount > 0 && node.firstChild?.type.name === 'blockContainer',
  ) ?? null
}

export function canNestBlock(state: EditorState) {
  const range = selectedBlockRange(state)
  if (!range || range.startIndex === 0) return false
  const currentDepth = getBlockNestingDepth(state.selection.$from)
  let relativeDepth = 0
  for (let index = range.startIndex; index < range.endIndex; index += 1) {
    relativeDepth = Math.max(relativeDepth, getNodeBlockDepth(range.parent.child(index)))
  }
  if (currentDepth + relativeDepth > MAX_BLOCK_DEPTH) return false
  return range.parent.child(range.startIndex - 1).type.name === 'blockContainer'
}

export function nestBlock(state: EditorState, dispatch?: (transaction: Transaction) => void) {
  const range = selectedBlockRange(state)
  if (!range || !canNestBlock(state)) return false
  if (!dispatch) return true

  const itemType = state.schema.nodes.blockContainer
  const groupType = state.schema.nodes.blockGroup
  const previous = range.parent.child(range.startIndex - 1)
  const nestedBefore = previous.lastChild?.type === groupType
  const inner = Fragment.from(nestedBefore ? itemType.create() : null)
  const slice = new Slice(
    Fragment.from(itemType.create(null, Fragment.from(groupType.create(null, inner)))),
    nestedBefore ? 3 : 1,
    0,
  )
  dispatch(state.tr.step(new ReplaceAroundStep(
    range.start - (nestedBefore ? 3 : 1),
    range.end,
    range.start,
    range.end,
    slice,
    1,
    true,
  )).scrollIntoView())
  return true
}
