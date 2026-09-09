// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { createEditor } from '../../../test/create-editor'
import { block, doc } from '../../../test/fixtures'
import { moveSelection } from './move-selection'

test.each([-1, 1] as const)('moves a sibling in direction %i and preserves history', direction => {
  const editor = createEditor(doc(block('a', 'A'), block('b', 'B'), block('c', 'C')), 7)
  const before = editor.getJSON()
  expect(moveSelection(editor.view, direction)).toBe(true)
  expect(editor.state.doc.textContent).toBe(direction < 0 ? 'BAC' : 'ACB')
  expect(editor.commands.undo()).toBe(true)
  expect(editor.getJSON()).toEqual(before)
  expect(editor.commands.redo()).toBe(true)
})
test('does not move outside sibling boundaries', () => {
  const editor = createEditor()
  expect(moveSelection(editor.view, -1)).toBe(false)
  expect(moveSelection(editor.view, 1)).toBe(false)
})

test('reorders nested siblings while retaining parent and children', () => {
  const editor = createEditor(doc(block('parent', '', 'paragraph', [block('a', 'A'), block('b', 'B')])), 6)
  expect(moveSelection(editor.view, 1)).toBe(true)
  expect(editor.state.doc.firstChild?.attrs.id).toBe('parent')
  expect(editor.state.doc.firstChild?.lastChild?.textContent).toBe('BA')
  expect(() => editor.state.doc.check()).not.toThrow()
})
