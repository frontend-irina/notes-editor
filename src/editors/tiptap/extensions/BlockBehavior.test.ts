// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { createEditor } from '../../../test/create-editor'
import { block, doc } from '../../../test/fixtures'

test.each(['Backspace', 'Delete'])('%s removes empty blocks via registered keymaps', key => {
  const editor = createEditor(doc(block('a', 'text'), block('b')), 10)
  expect(editor.commands.keyboardShortcut(key)).toBe(true)
  expect(editor.state.doc.childCount).toBe(1)
})
test('quote shortcut preserves ID and text and Enter splits the quote', () => {
  const editor = createEditor(doc(block('a', 'text')), 4)
  editor.commands.keyboardShortcut('Mod-Alt-q')
  expect(editor.state.doc.firstChild?.firstChild?.type.name).toBe('quote')
  expect(editor.state.doc.firstChild?.attrs.id).toBe('a')
  editor.commands.keyboardShortcut('Enter')
  expect(editor.state.doc.childCount).toBe(2)
  expect(editor.state.doc.textContent).toBe('text')
})

