import {
  MAX_BLOCK_DEPTH,
  type Block,
  type FlatBlock,
} from '../types'

export type BlockTreeErrorCode =
  | 'DUPLICATE_ID'
  | 'INVALID_SIBLING_REFERENCE'
  | 'AMBIGUOUS_SIBLING_ORDER'
  | 'MAX_DEPTH_EXCEEDED'
  | 'MISSING_PARENT'
  | 'PARENT_CYCLE'

export class BlockTreeError extends Error {
  readonly code: BlockTreeErrorCode
  readonly blockIds: string[]

  constructor(
    code: BlockTreeErrorCode,
    blockIds: string[],
    message: string,
  ) {
    super(message)
    this.name = 'BlockTreeError'
    this.code = code
    this.blockIds = blockIds
  }
}

function shallowBlock(block: Block): Block {
  return { ...block, children: [] } as Block
}

function flattenDescendants(blocks: Block[]): Block[] {
  const flattened: Block[] = []
  for (const block of blocks) {
    flattened.push(shallowBlock(block))
    flattened.push(...flattenDescendants(block.children))
  }
  return flattened
}

export function normalizeBlockDepth(blocks: Block[], depth = 1): Block[] {
  if (depth >= MAX_BLOCK_DEPTH) {
    const normalized: Block[] = []
    for (const block of blocks) {
      normalized.push(shallowBlock(block))
      normalized.push(...flattenDescendants(block.children))
    }
    return normalized
  }

  return blocks.map((block) => ({
    ...block,
    children: normalizeBlockDepth(block.children, depth + 1),
  }) as Block)
}

export function flattenBlocks(blocks: Block[]): FlatBlock[] {
  const result: FlatBlock[] = []
  const ids = new Set<string>()

  const visit = (siblings: Block[], parentId: string | null, depth: number) => {
    if (depth > MAX_BLOCK_DEPTH) {
      throw new BlockTreeError(
        'MAX_DEPTH_EXCEEDED',
        siblings.map((block) => block.id),
        `Block depth exceeds ${MAX_BLOCK_DEPTH}`,
      )
    }

    siblings.forEach((block, index) => {
      if (ids.has(block.id)) {
        throw new BlockTreeError('DUPLICATE_ID', [block.id], `Duplicate block ID: ${block.id}`)
      }
      ids.add(block.id)
      const { children, ...data } = block
      result.push({
        ...data,
        parentId,
        position: {
          before: siblings[index - 1]?.id ?? null,
          after: siblings[index + 1]?.id ?? null,
        },
      } as FlatBlock)
      visit(children, block.id, depth + 1)
    })
  }

  visit(blocks, null, 1)
  return result
}

function orderedSiblings(blocks: FlatBlock[], parentId: string | null): FlatBlock[] {
  if (blocks.length === 0) return []
  const byId = new Map(blocks.map((block) => [block.id, block]))
  const invalid = blocks.filter((block) => (
    (block.position.before !== null && !byId.has(block.position.before))
    || (block.position.after !== null && !byId.has(block.position.after))
  ))
  if (invalid.length > 0) {
    throw new BlockTreeError(
      'INVALID_SIBLING_REFERENCE',
      invalid.map((block) => block.id),
      `Sibling reference crosses group ${parentId ?? 'root'}`,
    )
  }

  const first = blocks.filter((block) => block.position.before === null)
  const last = blocks.filter((block) => block.position.after === null)
  if (first.length !== 1 || last.length !== 1) {
    throw new BlockTreeError(
      'AMBIGUOUS_SIBLING_ORDER',
      blocks.map((block) => block.id),
      `Sibling group ${parentId ?? 'root'} does not have one start and one end`,
    )
  }

  const ordered: FlatBlock[] = []
  const visited = new Set<string>()
  let current: FlatBlock | undefined = first[0]
  while (current) {
    if (visited.has(current.id)) break
    visited.add(current.id)
    ordered.push(current)
    const nextId = current.position.after
    if (nextId === null) break
    const next = byId.get(nextId)
    if (!next || next.position.before !== current.id) {
      throw new BlockTreeError(
        'INVALID_SIBLING_REFERENCE',
        [current.id, nextId],
        `Sibling references are not reciprocal: ${current.id} -> ${nextId}`,
      )
    }
    current = next
  }

  if (ordered.length !== blocks.length || ordered.at(-1)?.id !== last[0].id) {
    throw new BlockTreeError(
      'AMBIGUOUS_SIBLING_ORDER',
      blocks.map((block) => block.id),
      `Sibling group ${parentId ?? 'root'} is disconnected or cyclic`,
    )
  }
  return ordered
}

export function buildBlockTree(flatBlocks: FlatBlock[]): Block[] {
  const byId = new Map<string, FlatBlock>()
  for (const block of flatBlocks) {
    if (byId.has(block.id)) {
      throw new BlockTreeError('DUPLICATE_ID', [block.id], `Duplicate block ID: ${block.id}`)
    }
    byId.set(block.id, block)
  }

  const missingParents = flatBlocks.filter((block) => (
    block.parentId !== null && !byId.has(block.parentId)
  ))
  if (missingParents.length > 0) {
    throw new BlockTreeError(
      'MISSING_PARENT',
      missingParents.map((block) => block.id),
      'One or more parent blocks are missing',
    )
  }

  for (const block of flatBlocks) {
    const path = new Set<string>()
    let current: FlatBlock | undefined = block
    while (current) {
      if (path.has(current.id)) {
        throw new BlockTreeError('PARENT_CYCLE', [...path, current.id], 'Parent cycle detected')
      }
      path.add(current.id)
      current = current.parentId === null ? undefined : byId.get(current.parentId)
    }
  }

  const groups = new Map<string | null, FlatBlock[]>()
  for (const block of flatBlocks) {
    const group = groups.get(block.parentId) ?? []
    group.push(block)
    groups.set(block.parentId, group)
  }
  const orderedGroups = new Map<string | null, FlatBlock[]>()
  for (const [parentId, group] of groups) {
    orderedGroups.set(parentId, orderedSiblings(group, parentId))
  }

  const build = (parentId: string | null, depth: number): Block[] => {
    const siblings = orderedGroups.get(parentId) ?? []
    if (depth > MAX_BLOCK_DEPTH && siblings.length > 0) {
      throw new BlockTreeError(
        'MAX_DEPTH_EXCEEDED',
        siblings.map((block) => block.id),
        `Block depth exceeds ${MAX_BLOCK_DEPTH}`,
      )
    }
    return siblings.map((block) => {
      const { parentId: _parentId, position: _position, ...data } = block
      return { ...data, children: build(block.id, depth + 1) } as Block
    })
  }

  return build(null, 1)
}
