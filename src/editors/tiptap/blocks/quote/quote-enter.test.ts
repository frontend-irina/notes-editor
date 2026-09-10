// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { createEditor } from '../../../../test/create-editor'
import { block, doc } from '../../../../test/fixtures'
import { handleQuoteEnter } from './quote-enter'

test.each([0, 2, 4])('splits quote at offset %i and supports history', offset => {
  const editor = createEditor(doc(block('a', 'abcd', 'quote')), offset + 2)
  const before = editor.getJSON()
  expect(handleQuoteEnter(editor)).toBe(true)
  expect(editor.state.doc.childCount).toBe(2)
  expect(editor.state.doc.child(0).textContent).toBe('abcd'.slice(0, offset))
  expect(editor.state.doc.child(1).textContent).toBe('abcd'.slice(offset))
  expect(editor.state.doc.child(0).attrs.id).toBe('a')
  expect(editor.state.doc.child(1).attrs.id).not.toBe('a')
  expect(editor.state.selection.$from.parent.type.name).toBe('quote')
  expect(editor.commands.undo()).toBe(true)
  expect(editor.getJSON()).toEqual(before)
  expect(editor.commands.redo()).toBe(true)
  expect(editor.state.doc.childCount).toBe(2)
})

test('handles an empty quote with children without losing their content', () => {
  const editor = createEditor(doc(block('a', '', 'quote', [block('child', 'kept')])))
  expect(handleQuoteEnter(editor)).toBe(true)
  expect(editor.state.doc.textContent).toBe('kept')
  expect(editor.state.doc.child(0).lastChild?.firstChild?.attrs.id).toBe('child')
})

test('ignores a different content type', () => {
  const editor = createEditor(doc(block('a', 'text', 'paragraph')))
  expect(handleQuoteEnter(editor)).toBe(false)
})

test('splits inside a nested quote without dropping children or parent props', () => {
  const quote = { ...block('quote', 'ab', 'quote', [block('child', 'kept')]), attrs: { id: 'quote', textColor: 'red' } }
  const editor = createEditor(doc(block('parent', '', 'paragraph', [quote])), 7)
  expect(handleQuoteEnter(editor)).toBe(true)
  const group = editor.state.doc.firstChild?.lastChild
  expect(group?.childCount).toBe(2)
  expect(group?.child(0).attrs).toMatchObject({ id: 'quote', textColor: 'red' })
  expect(group?.child(0).lastChild?.firstChild?.attrs.id).toBe('child')
  expect(group?.child(1).textContent).toBe('b')
})
