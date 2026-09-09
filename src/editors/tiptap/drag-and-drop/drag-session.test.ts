// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { createEditor } from '../../../test/create-editor'
import { dragEvent } from '../../../test/drag-event'
import { endDrag, getActiveDrag, startDrag } from './drag-session'

test('owns shared session, MIME payload and preview cleanup', () => {
  const editor = createEditor()
  const { event, transfer } = dragEvent('dragstart')
  startDrag(editor.view, event, 'a')
  const drag = getActiveDrag()!
  expect(drag.source).toBe(editor.view)
  expect(drag.preview?.isConnected).toBe(true)
  expect(transfer.effectAllowed).toBe('move')
  expect(transfer.getData('blocknote/html')).toBe(transfer.getData('text/html'))
  expect(transfer.setDragImage).toHaveBeenCalledOnce()
  endDrag()
  expect(getActiveDrag()).toBeNull()
  expect(drag.preview?.isConnected).toBe(false)
})
test('ignores missing IDs, missing transfer and readonly views', () => {
  const editor = createEditor()
  startDrag(editor.view, dragEvent().event, 'missing')
  startDrag(editor.view, new Event('dragstart') as DragEvent, 'a')
  editor.setEditable(false)
  startDrag(editor.view, dragEvent().event, 'a')
  expect(getActiveDrag()).toBeNull()
})

