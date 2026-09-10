// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '../test/react'
import { createEditor } from '../test/create-editor'
import { EditorHistoryActions } from './EditorHistoryActions'

test('updates undo/redo availability and responds to editor replacement', async () => {
  const editor = createEditor()
  const rendered = render(<EditorHistoryActions editor={null} />)
  expect(screen.getByRole('button', { name: 'Отменить' })).toBeDisabled()
  rendered.rerender(<EditorHistoryActions editor={editor} />)
  act(() => { editor.commands.insertContent('text') })
  expect(screen.getByRole('button', { name: 'Отменить' })).toBeEnabled()
  fireEvent.click(screen.getByRole('button', { name: 'Отменить' }))
  expect(editor.state.doc.textContent).toBe('')
  fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
  expect(editor.state.doc.textContent).toBe('text')
  rendered.rerender(<EditorHistoryActions editor={createEditor()} />)
  await waitFor(() => expect(screen.getByRole('button', { name: 'Отменить' })).toBeDisabled())
  rendered.unmount()
})
