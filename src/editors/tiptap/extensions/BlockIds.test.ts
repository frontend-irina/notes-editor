// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { createEditor } from '../../../test/create-editor'
import { block, doc } from '../../../test/fixtures'

test('repairs missing and duplicate IDs without changing stable IDs or looping', () => {
  const editor = createEditor(doc(block('stable'), block('stable'), block('')))
  editor.view.dispatch(editor.state.tr.insertText('x', 2))
  const ids: string[] = []
  editor.state.doc.descendants(node => { if (node.type.name === 'blockContainer') ids.push(node.attrs.id) })
  expect(ids[0]).toBe('stable')
  expect(new Set(ids).size).toBe(3)
  expect(ids.slice(1).every(id => /^[\da-f-]{14}7/.test(id))).toBe(true)
  const result = editor.state.applyTransaction(editor.state.tr)
  expect(result.transactions).toHaveLength(1)
  expect(result.state.doc.eq(editor.state.doc)).toBe(true)
})

