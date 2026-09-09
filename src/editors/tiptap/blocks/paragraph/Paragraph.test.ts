// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { createEditor } from '../../../../test/create-editor'
import { block, doc } from '../../../../test/fixtures'

test('renders paragraph HTML and converts heading through the paragraph shortcut', () => {
  const editor = createEditor(doc(block('a', 'text', 'heading')))
  editor.commands.keyboardShortcut('Mod-Alt-0')
  expect(editor.state.doc.firstChild?.firstChild?.type.name).toBe('paragraph')
  expect(editor.getHTML()).toContain('<p>text</p>')
  expect(editor.state.doc.firstChild?.attrs.id).toBe('a')
  editor.commands.keyboardShortcut('Enter')
  expect(editor.state.doc.childCount).toBe(2)
})

