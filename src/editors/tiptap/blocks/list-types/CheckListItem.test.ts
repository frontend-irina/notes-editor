// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { DOMParser } from '@tiptap/pm/model'
import { createEditor, schema } from '../../../../test/create-editor'
import { block, doc } from '../../../../test/fixtures'

test('checkbox changes document state and receives transaction updates', () => {
  const editor = createEditor(doc(block('a', 'task', 'checkListItem')))
  const checkbox = editor.view.dom.querySelector('input')!
  expect(checkbox.checked).toBe(false)
  checkbox.checked = true
  checkbox.dispatchEvent(new Event('change', { bubbles: true }))
  expect(editor.state.doc.firstChild?.firstChild?.attrs.checked).toBe(true)
  editor.commands.updateAttributes('checkListItem', { checked: false })
  expect(checkbox.checked).toBe(false)
  editor.commands.setNode('paragraph')
  expect(editor.view.dom.querySelector('input')).toBeNull()
})
test('readonly checklist does not accept checkbox changes', () => {
  const editor = createEditor(doc(block('a', 'task', 'checkListItem')), 2, { editable: false })
  const checkbox = editor.view.dom.querySelector('input')!
  expect(checkbox.disabled).toBe(true)
  checkbox.checked = true
  checkbox.dispatchEvent(new Event('change', { bubbles: true }))
  expect(editor.state.doc.firstChild?.firstChild?.attrs.checked).toBe(false)
})

test('imports checked list metadata ahead of generic StarterKit list items', () => {
  const host = document.createElement('div')
  host.innerHTML = '<li data-list-type="check" data-checked="true">task</li>'
  const node = DOMParser.fromSchema(schema).parseSlice(host).content.firstChild
  expect(node?.type.name).toBe('checkListItem')
  expect(node?.attrs.checked).toBe(true)
})
