import { expect, test } from 'vitest'
import { createState } from '../../../../test/create-editor'
import { block, doc } from '../../../../test/fixtures'
import { getBlockDepth } from './block-position'

test('finds the closest container at each nesting level', () => {
  const state = createState(doc(block('parent', '', 'paragraph', [block('child', 'x')])))
  expect(getBlockDepth(state.doc.resolve(0))).toBe(-1)
  expect(getBlockDepth(state.doc.resolve(2))).toBe(1)
  expect(getBlockDepth(state.doc.resolve(6))).toBe(3)
})

