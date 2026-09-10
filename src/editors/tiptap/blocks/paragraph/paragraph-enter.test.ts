// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { createEditor } from '../../../../test/create-editor'
import { block, doc } from '../../../../test/fixtures'
import { handleParagraphEnter } from './paragraph-enter'

test.each([0, 2, 4])('splits paragraph at offset %i and supports history', offset => {
  const editor = createEditor(doc(block('a', 'abcd', 'paragraph')), offset + 2)
  const before = editor.getJSON()
  expect(handleParagraphEnter(editor, editor.schema.nodes.paragraph)).toBe(true)
  expect(editor.state.doc.childCount).toBe(2)
  expect(editor.state.doc.child(0).textContent).toBe('abcd'.slice(0, offset))
  expect(editor.state.doc.child(1).textContent).toBe('abcd'.slice(offset))
  expect(editor.state.doc.child(0).attrs.id).toBe('a')
  expect(editor.state.doc.child(1).attrs.id).not.toBe('a')
  expect(editor.state.selection.$from.parent.type.name).toBe('paragraph')
  expect(editor.commands.undo()).toBe(true)
  expect(editor.getJSON()).toEqual(before)
  expect(editor.commands.redo()).toBe(true)
  expect(editor.state.doc.childCount).toBe(2)
})

test('handles an empty paragraph with children without losing their content', () => {
  const editor = createEditor(doc(block('a', '', 'paragraph', [block('child', 'kept')])))
  expect(handleParagraphEnter(editor, editor.schema.nodes.paragraph)).toBe(true)
  expect(editor.state.doc.textContent).toBe('kept')
  expect(editor.state.doc.child(1).lastChild?.firstChild?.attrs.id).toBe('child')
})

test('ignores a different content type', () => {
  const editor = createEditor(doc(block('a', 'text', 'heading')))
  expect(handleParagraphEnter(editor, editor.schema.nodes.paragraph)).toBe(false)
})

test('removes selected text when splitting and lifts an empty nested block', () => {
  const editor = createEditor(doc(block('a', 'abcd', 'paragraph')))
  editor.commands.setTextSelection({ from: 3, to: 5 })
  expect(handleParagraphEnter(editor, editor.schema.nodes.paragraph)).toBe(true)
  expect(editor.state.doc.textContent).toBe('ad')
  const nested = createEditor(doc(block('parent', '', 'paragraph', [block('lift', '', 'paragraph')])), 6)
  expect(handleParagraphEnter(nested, nested.schema.nodes.paragraph)).toBe(true)
  expect(nested.state.doc.childCount).toBe(2)
  expect(nested.state.doc.child(1).attrs.id).toBe('lift')
})
