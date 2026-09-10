// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { createEditor } from '../../../test/create-editor'
import { block, doc } from '../../../test/fixtures'
import { deleteEmptyBlockAndSelectPrevious } from './delete-empty-block'

test('removes an empty sibling with its children and selects previous content', () => {
  const editor = createEditor(doc(block('a', 'text'), block('b', '', 'paragraph', [block('child')])), 10)
  const before = editor.getJSON()
  expect(deleteEmptyBlockAndSelectPrevious(editor)).toBe(true)
  expect(editor.state.doc.childCount).toBe(1)
  expect(editor.state.selection.from).toBe(6)
  expect(editor.commands.undo()).toBe(true)
  expect(editor.getJSON()).toEqual(before)
})
test('preserves the first block, nonempty content and range selections', () => {
  const editor = createEditor()
  expect(deleteEmptyBlockAndSelectPrevious(editor)).toBe(false)
  editor.commands.setContent(doc(block('a', 'text')))
  editor.commands.setTextSelection({ from: 2, to: 4 })
  expect(deleteEmptyBlockAndSelectPrevious(editor)).toBe(false)
  editor.commands.setTextSelection(3)
  expect(deleteEmptyBlockAndSelectPrevious(editor)).toBe(false)
})

