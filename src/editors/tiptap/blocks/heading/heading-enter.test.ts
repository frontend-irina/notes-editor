// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { createEditor } from '../../../../test/create-editor'
import { block, doc } from '../../../../test/fixtures'
import { handleHeadingEnter } from './heading-enter'

test.each([0, 2, 4])('splits heading at offset %i and supports history', offset => {
  const editor = createEditor(doc(block('a', 'abcd', 'heading')), offset + 2)
  const before = editor.getJSON()
  expect(handleHeadingEnter(editor, editor.schema.nodes.heading)).toBe(true)
  expect(editor.state.doc.childCount).toBe(2)
  expect(editor.state.doc.child(0).textContent).toBe('abcd'.slice(0, offset))
  expect(editor.state.doc.child(1).textContent).toBe('abcd'.slice(offset))
  expect(editor.state.doc.child(0).attrs.id).toBe('a')
  expect(editor.state.doc.child(1).attrs.id).not.toBe('a')
  expect(editor.state.selection.$from.parent.type.name).toBe(offset === 0 ? 'heading' : 'paragraph')
  expect(editor.commands.undo()).toBe(true)
  expect(editor.getJSON()).toEqual(before)
  expect(editor.commands.redo()).toBe(true)
  expect(editor.state.doc.childCount).toBe(2)
})

test('handles an empty heading with children without losing their content', () => {
  const editor = createEditor(doc(block('a', '', 'heading', [block('child', 'kept')])))
  expect(handleHeadingEnter(editor, editor.schema.nodes.heading)).toBe(true)
  expect(editor.state.doc.textContent).toBe('kept')
  expect(editor.state.doc.child(1).lastChild?.firstChild?.attrs.id).toBe('child')
})

test('ignores a different content type', () => {
  const editor = createEditor(doc(block('a', 'text', 'paragraph')))
  expect(handleHeadingEnter(editor, editor.schema.nodes.heading)).toBe(false)
})

test('removes selected text when splitting and lifts an empty nested block', () => {
  const editor = createEditor(doc(block('a', 'abcd', 'heading')))
  editor.commands.setTextSelection({ from: 3, to: 5 })
  expect(handleHeadingEnter(editor, editor.schema.nodes.heading)).toBe(true)
  expect(editor.state.doc.textContent).toBe('ad')
  const nested = createEditor(doc(block('parent', '', 'paragraph', [block('lift', '', 'heading')])), 6)
  expect(handleHeadingEnter(nested, nested.schema.nodes.heading)).toBe(true)
  expect(nested.state.doc.childCount).toBe(2)
  expect(nested.state.doc.child(1).attrs.id).toBe('lift')
})
