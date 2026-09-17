import type { Block, FlatBlock } from '../types'
import { buildBlockTree, flattenBlocks } from './blocks'

export type FlatBlockDiff = {
  created: string[]
  updated: string[]
  moved: string[]
  deleted: string[]
}

export function toBackendBlocks(blocks: Block[]): FlatBlock[] {
  return flattenBlocks(blocks)
}

export function fromBackendBlocks(blocks: FlatBlock[]): Block[] {
  return buildBlockTree(blocks)
}

function samePosition(left: FlatBlock, right: FlatBlock) {
  return left.parentId === right.parentId
    && left.position.before === right.position.before
    && left.position.after === right.position.after
}

function sameData(left: FlatBlock, right: FlatBlock) {
  const { parentId: _leftParent, position: _leftPosition, ...leftData } = left
  const { parentId: _rightParent, position: _rightPosition, ...rightData } = right
  return JSON.stringify(leftData) === JSON.stringify(rightData)
}

export function diffFlatBlocks(confirmed: FlatBlock[], current: FlatBlock[]): FlatBlockDiff {
  const confirmedById = new Map(confirmed.map((block) => [block.id, block]))
  const currentById = new Map(current.map((block) => [block.id, block]))
  const diff: FlatBlockDiff = { created: [], updated: [], moved: [], deleted: [] }

  for (const block of current) {
    const previous = confirmedById.get(block.id)
    if (!previous) {
      diff.created.push(block.id)
      continue
    }
    if (!samePosition(previous, block)) diff.moved.push(block.id)
    if (!sameData(previous, block)) diff.updated.push(block.id)
  }
  for (const block of confirmed) {
    if (!currentById.has(block.id)) diff.deleted.push(block.id)
  }
  return diff
}
