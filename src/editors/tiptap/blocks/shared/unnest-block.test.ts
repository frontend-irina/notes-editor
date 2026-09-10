import { expect, test } from 'vitest'
import { createState } from '../../../../test/create-editor'
import { block, doc } from '../../../../test/fixtures'
import { unnestEmptyBlock } from './unnest-block'

test('lifts a nested empty block and attaches following siblings as its children', () => {
  const state = createState(doc(block('parent', '', 'paragraph', [block('lift'), block('next', 'kept')])), 6)
  const tr = state.tr
  expect(unnestEmptyBlock(tr)).toBe(true)
  expect(tr.doc.childCount).toBe(2)
  expect(tr.doc.child(0).attrs.id).toBe('parent')
  expect(tr.doc.child(1).attrs.id).toBe('lift')
  expect(tr.doc.child(1).lastChild?.firstChild?.attrs.id).toBe('next')
  expect(tr.doc.textContent).toBe('kept')
  expect(() => tr.doc.check()).not.toThrow()
})
test('cannot lift a root block', () => {
  expect(unnestEmptyBlock(createState().tr)).toBe(false)
})

test('keeps attrs and existing children while lifting before another sibling', () => {
  const lifted = { ...block('lift', '', 'paragraph', [block('own', 'own')]), attrs: { id: 'lift', textColor: 'red' } }
  const tr = createState(doc(block('parent', '', 'paragraph', [lifted, block('next', 'next')])), 6).tr
  expect(unnestEmptyBlock(tr)).toBe(true)
  expect(tr.doc.child(1).attrs).toMatchObject({ id: 'lift', textColor: 'red' })
  expect(tr.doc.child(1).lastChild?.childCount).toBe(2)
  expect(tr.doc.textContent).toBe('ownnext')
})
