import { expect, test } from 'vitest'
import { Selection } from '@tiptap/pm/state'
import { MAX_BLOCK_DEPTH } from '../../types'
import { createState } from '../../../../test/create-editor'
import { block, doc } from '../../../../test/fixtures'
import { canNestBlock, nestBlock } from './nest-block'

test('nests a block below its previous sibling', () => {
  let state = createState(doc(block('a'), block('b', 'text')), 6)
  expect(canNestBlock(state)).toBe(true)
  expect(nestBlock(state, transaction => { state = state.apply(transaction) })).toBe(true)
  expect(state.doc.firstChild?.lastChild?.firstChild?.attrs.id).toBe('b')
})

test('does not nest a level-five block or create a transaction', () => {
  const document = doc(block('level-1', '', 'paragraph', [
    block('level-2', '', 'paragraph', [
      block('level-3', '', 'paragraph', [
        block('level-4', '', 'paragraph', [block('previous'), block('level-5', 'text')]),
      ]),
    ]),
  ]))
  const state = createState(document)
  let position = 0
  state.doc.descendants((node, pos) => {
    if (node.attrs.id === 'level-5') position = pos + 2
  })
  const selected = state.apply(state.tr.setSelection(
    Selection.near(state.doc.resolve(position)),
  ))
  expect(MAX_BLOCK_DEPTH).toBe(5)
  expect(canNestBlock(selected)).toBe(false)
})

test('does not nest a subtree when its descendant would exceed the limit', () => {
  const document = doc(block('level-1', '', 'paragraph', [
    block('level-2', '', 'paragraph', [
      block('level-3', '', 'paragraph', [
        block('previous'),
        block('level-4', 'text', 'paragraph', [block('level-5')]),
      ]),
    ]),
  ]))
  const state = createState(document)
  let position = 0
  state.doc.descendants((node, pos) => {
    if (node.attrs.id === 'level-4') position = pos + 2
  })
  const selected = state.apply(state.tr.setSelection(Selection.near(state.doc.resolve(position))))
  expect(canNestBlock(selected)).toBe(false)
})
