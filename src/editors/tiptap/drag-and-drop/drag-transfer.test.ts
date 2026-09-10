// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { Node } from '@tiptap/core'
import { createEditorExtensions } from '../editor-extensions'
import { createEditor } from '../../../test/create-editor'
import { block, doc } from '../../../test/fixtures'
import { blockRangeAtPosition } from './block-range'
import { createPreview, serializeRange } from './drag-transfer'

test('exports HTML and plain text independently of editor widget DOM', () => {
  const editor = createEditor(doc(block('a', 'text', 'paragraph', [block('child', 'nested')])))
  const range = blockRangeAtPosition(editor.state.doc, 2)!
  const before = editor.getJSON()
  const data = serializeRange(editor.view, range)
  expect(data.text).toBe('textnested')
  expect(data.html).toContain('data-id="child"')
  expect(data.html).not.toContain('tiptap-drag-handle')
  expect(editor.getJSON()).toEqual(before)
  const preview = createPreview(editor.view, range)
  expect(preview.isConnected).toBe(true)
  expect(preview.textContent).toBe('textnested')
  preview.remove()
})

test.each(['iframe', 'embed', 'object'])('strips %s from the preview of a custom schema', tag => {
  const unsafe = Node.create({ name: 'unsafe', group: 'inline', inline: true, atom: true,
    renderHTML: () => [tag] })
  const content = block('a')
  content.content![0].content = [{ type: 'unsafe' }]
  const editor = createEditor(doc(content), 2, { extensions: [...createEditorExtensions(), unsafe] })
  const range = blockRangeAtPosition(editor.state.doc, 2)!
  const preview = createPreview(editor.view, range)
  expect(preview.querySelector(tag)).toBeNull()
  expect(editor.state.doc.firstChild?.firstChild?.firstChild?.type.name).toBe('unsafe')
  preview.remove()
})
