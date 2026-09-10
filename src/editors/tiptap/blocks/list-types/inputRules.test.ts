// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { createEditor } from '../../../../test/create-editor'
import { block, doc } from '../../../../test/fixtures'

test.each([
  ['-', 'bulletListItem', {}], ['+', 'bulletListItem', {}],
  ['*', 'bulletListItem', {}], ['3.', 'numberedListItem', { start: 3 }],
  ['[]', 'checkListItem', { checked: false }], ['[x]', 'checkListItem', { checked: true }],
  ['##', 'heading', { level: 2 }], ['>', 'quote', {}],
])('input marker %s applies the expected block', (marker, type, attrs) => {
  const editor = createEditor(doc(block('a', marker)), marker.length + 2)
  const pos = editor.state.selection.from
  editor.view.someProp('handleTextInput', handler => handler(editor.view, pos, pos, ' ', () => editor.state.tr))
  expect(editor.state.doc.firstChild?.firstChild?.type.name).toBe(type)
  expect(editor.state.doc.firstChild?.firstChild?.attrs).toMatchObject(attrs)
  expect(editor.state.doc.firstChild?.textContent).toBe('')
})
test('bullet rules do not replace headings or match ordinary text', () => {
  for (const [type, text] of [['heading', '-'], ['paragraph', 'hello']]) {
    const editor = createEditor(doc(block('a', text, type)), text.length + 2)
    const pos = editor.state.selection.from
    editor.view.someProp('handleTextInput', handler => handler(editor.view, pos, pos, ' ', () => editor.state.tr))
    expect(editor.state.doc.firstChild?.firstChild?.type.name).toBe(type)
    expect(editor.state.doc.firstChild?.textContent).toBe(text)
  }
})

