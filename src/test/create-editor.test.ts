// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { createEditor, destroyTestEditors } from './create-editor'
import { dragEvent } from './drag-event'
import { getActiveDrag, startDrag } from '../editors/tiptap/drag-and-drop/drag-session'

test('fixture cleanup destroys editors, removes hosts and ends active drag', () => {
  const editor = createEditor()
  const host = editor.options.element as HTMLElement
  startDrag(editor.view, dragEvent().event, 'a')
  expect(getActiveDrag()).not.toBeNull()
  destroyTestEditors()
  expect(editor.isDestroyed).toBe(true)
  expect(host.isConnected).toBe(false)
  expect(getActiveDrag()).toBeNull()
  expect(document.querySelector('.tiptap-block-drag-preview')).toBeNull()
})
