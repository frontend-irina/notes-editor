// @vitest-environment jsdom
import { expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '../test/react'
import { BlockNoteEditor } from './BlockNoteEditor'

const adapter = vi.hoisted(() => ({
  create: vi.fn(),
  editor: { document: [{ id: 'saved', type: 'paragraph', content: [] }] },
}))
vi.mock('@blocknote/react', () => ({
  useCreateBlockNote: (options: unknown) => { adapter.create(options); return adapter.editor },
}))
vi.mock('@blocknote/mantine', () => ({
  BlockNoteView: ({ onChange }: { onChange: () => void }) => <button onClick={onChange}>Edit BlockNote</button>,
}))

test.each([null, '{'])('loads defaults when storage is absent or malformed: %s', saved => {
  if (saved) localStorage.setItem('editor-playground:blocknote', saved)
  render(<BlockNoteEditor />)
  expect(adapter.create.mock.lastCall?.[0].initialContent[0].type).toBe('heading')
})
test('loads saved blocks and persists changes through the adapter callback', () => {
  localStorage.setItem('editor-playground:blocknote', JSON.stringify(adapter.editor.document))
  render(<BlockNoteEditor />)
  expect(adapter.create.mock.lastCall?.[0].initialContent).toEqual(adapter.editor.document)
  fireEvent.click(screen.getByRole('button', { name: 'Edit BlockNote' }))
  expect(JSON.parse(localStorage.getItem('editor-playground:blocknote')!)).toEqual(adapter.editor.document)
})
test('storage read/write errors do not prevent editing', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
  render(<BlockNoteEditor />)
  expect(() => fireEvent.click(screen.getByRole('button', { name: 'Edit BlockNote' }))).not.toThrow()
})

