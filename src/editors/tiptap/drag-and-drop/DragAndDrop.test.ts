// @vitest-environment jsdom
import { expect, test, vi } from 'vitest'
import { createEditor } from '../../../test/create-editor'
import { dragEvent } from '../../../test/drag-event'
import { getActiveDrag } from './drag-session'

test.each(['dragend', 'Escape'])('cleans session and preview on %s', ending => {
  const editor = createEditor()
  const handle = editor.view.dom.querySelector('.tiptap-drag-handle')!
  handle.dispatchEvent(dragEvent('dragstart').event)
  const preview = getActiveDrag()?.preview
  expect(preview?.isConnected).toBe(true)
  vi.spyOn(editor.view, 'posAtCoords').mockReturnValue({ pos: 0, inside: -1 })
  editor.view.dispatchEvent(dragEvent('dragover').event)
  expect(editor.view.dom.querySelector('.tiptap-drop-cursor')).not.toBeNull()
  editor.view.dispatchEvent(ending === 'Escape'
    ? new KeyboardEvent('keydown', { key: 'Escape' }) : dragEvent('dragend').event)
  expect(getActiveDrag()).toBeNull()
  expect(preview?.isConnected).toBe(false)
  expect(editor.view.dom.querySelector('.tiptap-drop-cursor')).toBeNull()
})

test('clears the cursor on leaving and the session on destroy; readonly cannot start', () => {
  const editor = createEditor()
  editor.view.dom.querySelector('.tiptap-drag-handle')!.dispatchEvent(dragEvent('dragstart').event)
  vi.spyOn(editor.view, 'posAtCoords').mockReturnValue({ pos: 0, inside: -1 })
  editor.view.dispatchEvent(dragEvent('dragover').event)
  editor.view.dispatchEvent(dragEvent('dragleave').event)
  expect(editor.view.dom.querySelector('.tiptap-drop-cursor')).toBeNull()
  const preview = getActiveDrag()?.preview
  editor.destroy()
  expect(getActiveDrag()).toBeNull()
  expect(preview?.isConnected).toBe(false)
  const readonly = createEditor(undefined, 2, { editable: false })
  readonly.view.dom.querySelector('.tiptap-drag-handle')!.dispatchEvent(dragEvent('dragstart').event)
  expect(getActiveDrag()).toBeNull()
})
