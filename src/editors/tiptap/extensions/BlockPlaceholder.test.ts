// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { createEditor } from '../../../test/create-editor'
import { block, doc } from '../../../test/fixtures'
import { createEditorExtensions } from '../editor-extensions'

test('decorates only the active empty block without adding document content', () => {
  const editor = createEditor(doc(block('active'), block('inactive'), block('filled', 'text')), 2, {
    extensions: createEditorExtensions({ placeholder: 'Write here' }),
  })
  const placeholders = editor.view.dom.querySelectorAll('.tiptap-empty-block')

  expect(editor.state.doc.textContent).toBe('text')
  expect(placeholders).toHaveLength(1)
  expect(placeholders[0].getAttribute('data-placeholder')).toBe('Write here')
  expect(placeholders[0].closest('.tiptap-block')?.getAttribute('data-id')).toBe('active')
})
