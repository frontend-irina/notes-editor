// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { createEditor } from '../../../../test/create-editor'
import { block, doc } from '../../../../test/fixtures'
import { handleListItemEnter } from './listItemEnter'

test.each(['bulletListItem', 'numberedListItem', 'checkListItem'])('continues and exits %s', type => {
  const editor = createEditor(doc(block('a', 'abcd', type, [block('child', 'nested')])), 4)
  expect(handleListItemEnter(editor, type)).toBe(true)
  expect(editor.state.doc.child(0).textContent).toBe('ab')
  expect(editor.state.doc.child(1).firstChild?.textContent).toBe('cd')
  expect(editor.state.doc.child(1).lastChild?.firstChild?.attrs.id).toBe('child')
  expect(editor.state.doc.child(1).firstChild?.type.name).toBe(type)
  expect(editor.commands.undo()).toBe(true)
  expect(editor.state.doc.firstChild?.firstChild?.textContent).toBe('abcd')
  const empty = createEditor(doc(block('empty', '', type)))
  expect(handleListItemEnter(empty, type)).toBe(true)
  expect(empty.state.doc.firstChild?.attrs.id).toBe('empty')
  expect(empty.state.doc.firstChild?.firstChild?.type.name).toBe('paragraph')
})

test('resets checked on the newly created item and ignores nonempty selections', () => {
  const editor = createEditor(doc(block('a', 'text', 'checkListItem')), 4)
  editor.commands.updateAttributes('checkListItem', { checked: true })
  expect(handleListItemEnter(editor, 'checkListItem')).toBe(true)
  expect(editor.state.doc.child(0).firstChild?.attrs.checked).toBe(true)
  expect(editor.state.doc.child(1).firstChild?.attrs.checked).toBe(false)
  editor.commands.setTextSelection({ from: 2, to: 3 })
  expect(handleListItemEnter(editor, 'checkListItem')).toBe(false)
  expect(handleListItemEnter(editor, 'paragraph')).toBe(false)
})

