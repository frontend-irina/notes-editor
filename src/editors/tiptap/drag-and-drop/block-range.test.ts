// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { createEditor } from '../../../test/create-editor'
import { block, doc } from '../../../test/fixtures'
import { blockRangeAtPosition, selectedBlockRange } from './block-range'

test('finds nested ranges and expands a selection to complete siblings', () => {
  const editor = createEditor(doc(block('a', 'aa'), block('b', 'bb'), block('c')))
  const range = blockRangeAtPosition(editor.state.doc, 2)!
  expect(range).toMatchObject({ from: 0, to: 6 })
  expect(selectedBlockRange(editor.view, range)).toBe(range)
  editor.commands.setTextSelection({ from: 3, to: 9 })
  expect(selectedBlockRange(editor.view, range)).toMatchObject({ from: 0, to: 12 })
  expect(blockRangeAtPosition(editor.state.doc, 100)).toBeNull()
  const nested = createEditor(doc(block('parent', '', 'paragraph', [block('child', 'x')])))
  expect(blockRangeAtPosition(nested.state.doc, 6)?.node.attrs.id).toBe('child')
})

test('expands a selection within a nested group without including its parent', () => {
  const editor = createEditor(doc(block('parent', '', 'paragraph', [block('a', 'AA'), block('b', 'BB')])))
  editor.commands.setTextSelection({ from: 6, to: 13 })
  const dragged = blockRangeAtPosition(editor.state.doc, 6)!
  const range = selectedBlockRange(editor.view, dragged)
  expect(range.from).toBe(4)
  expect(range.to).toBe(16)
  expect(editor.state.doc.slice(range.from, range.to).content.childCount).toBe(2)
})
