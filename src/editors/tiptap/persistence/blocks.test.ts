import { expect, test } from 'vitest'
import type { Block, FlatBlock } from '../types'
import {
  BlockTreeError,
  buildBlockTree,
  flattenBlocks,
  normalizeBlockDepth,
} from './blocks'

function paragraph(id: string, children: Block[] = []): Block {
  return {
    id,
    type: 'paragraph',
    props: { backgroundColor: 'default', textColor: 'default', textAlignment: 'left' },
    content: [{ type: 'text', text: id, styles: {} }],
    children,
  }
}

test('converts nested blocks to flat sibling links and restores arbitrary input order', () => {
  const tree = [paragraph('a', [paragraph('b'), paragraph('c')]), paragraph('d')]
  const flat = flattenBlocks(tree)

  expect(flat.map(({ id, parentId, position }) => ({ id, parentId, position }))).toEqual([
    { id: 'a', parentId: null, position: { before: null, after: 'd' } },
    { id: 'b', parentId: 'a', position: { before: null, after: 'c' } },
    { id: 'c', parentId: 'a', position: { before: 'b', after: null } },
    { id: 'd', parentId: null, position: { before: 'a', after: null } },
  ])
  expect(buildBlockTree([flat[2], flat[3], flat[0], flat[1]])).toEqual(tree)
})

test('flattens pasted levels deeper than five into level-five siblings', () => {
  const tree = [paragraph('a', [paragraph('b', [paragraph('c', [
    paragraph('d', [paragraph('e', [paragraph('f', [paragraph('g')])]), paragraph('h')]),
  ])])])]

  const normalized = normalizeBlockDepth(tree)
  expect(normalized[0].children[0].children[0].children[0].children.map((block) => block.id))
    .toEqual(['e', 'f', 'g', 'h'])
  expect(normalized[0].children[0].children[0].children[0].children.every(
    (block) => block.children.length === 0,
  )).toBe(true)
})

test.each([
  {
    code: 'MISSING_PARENT',
    change: (block: FlatBlock) => ({ ...block, parentId: 'missing' }),
  },
  {
    code: 'INVALID_SIBLING_REFERENCE',
    change: (block: FlatBlock) => ({ ...block, position: { ...block.position, after: 'missing' } }),
  },
])('rejects invalid flat data with $code', ({ code, change }) => {
  const flat = flattenBlocks([paragraph('a'), paragraph('b')])
  flat[0] = change(flat[0]) as FlatBlock
  expect(() => buildBlockTree(flat)).toThrowError(expect.objectContaining({ code }))
})

test('rejects duplicate IDs, parent cycles, and depth above the limit', () => {
  expect(() => flattenBlocks([paragraph('same'), paragraph('same')]))
    .toThrowError(expect.objectContaining({ code: 'DUPLICATE_ID' }))

  const cycle = flattenBlocks([paragraph('a'), paragraph('b')])
  cycle[0] = { ...cycle[0], parentId: 'b', position: { before: null, after: null } }
  cycle[1] = { ...cycle[1], parentId: 'a', position: { before: null, after: null } }
  expect(() => buildBlockTree(cycle))
    .toThrowError(expect.objectContaining({ code: 'PARENT_CYCLE' }))

  const tooDeep = [paragraph('a', [paragraph('b', [paragraph('c', [
    paragraph('d', [paragraph('e', [paragraph('f')])]),
  ])])])]
  expect(() => flattenBlocks(tooDeep))
    .toThrowError(expect.objectContaining({ code: 'MAX_DEPTH_EXCEEDED' }))
  expect(BlockTreeError).toBeDefined()
})
