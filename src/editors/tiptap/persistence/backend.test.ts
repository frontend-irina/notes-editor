import { expect, test } from 'vitest'
import type { Block } from '../types'
import { diffFlatBlocks, fromBackendBlocks, toBackendBlocks } from './backend'

test('round trips the frontend tree through the backend contract', () => {
  const blocks: Block[] = [{
    id: 'a',
    type: 'paragraph',
    props: { backgroundColor: 'default', textColor: 'default', textAlignment: 'left' },
    content: [],
    children: [],
  }]
  expect(fromBackendBlocks(toBackendBlocks(blocks))).toEqual(blocks)
})

test('moving a branch does not mark unchanged descendants as moved', () => {
  const child = (id: string, children: Block[] = []): Block => ({
    id,
    type: 'paragraph',
    props: { backgroundColor: 'default', textColor: 'default', textAlignment: 'left' },
    content: [],
    children,
  })
  const confirmed = toBackendBlocks([
    child('first-parent', [child('branch', [child('descendant')])]),
    child('second-parent'),
  ])
  const current = toBackendBlocks([
    child('first-parent'),
    child('second-parent', [child('branch', [child('descendant')])]),
  ])

  expect(diffFlatBlocks(confirmed, current).moved).toEqual(['branch'])
})
