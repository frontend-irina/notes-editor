// @vitest-environment jsdom
import { DOMParser } from '@tiptap/pm/model'
import { expect, test } from 'vitest'
import { createEditor, schema } from '../../../../test/create-editor'
import { block, doc } from '../../../../test/fixtures'

test('converts a block with the list shortcut and renders numbered metadata', () => {
  const editor = createEditor(doc(block('a', 'item')))
  editor.commands.keyboardShortcut('Mod-Shift-7')
  expect(editor.state.doc.firstChild?.firstChild?.type.name).toBe('numberedListItem')
  expect(editor.getHTML()).toContain('data-list-type="numbered"')
  expect(editor.state.doc.firstChild?.attrs.id).toBe('a')
  const host = document.createElement('div')
  host.innerHTML = '<li data-list-type="numbered" data-start="4">item</li>'
  const parsed = DOMParser.fromSchema(schema).parseSlice(host).content.firstChild
  expect(parsed?.type.name).toBe('numberedListItem')
  expect(parsed?.textContent).toBe('item')
  expect(parsed?.attrs.start).toBe(4)
})

