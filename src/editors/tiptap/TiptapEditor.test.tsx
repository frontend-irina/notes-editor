// @vitest-environment jsdom
import type { Editor } from '@tiptap/core'
import { expect, test, vi } from 'vitest'
import { act, render, waitFor } from '../../test/react'
import { TiptapEditor } from './TiptapEditor'

// Bubble positioning needs browser layout. Keep the real editor and all internal UI.
const bubble = vi.hoisted(() => ({ shouldShow: null as null | ((props: { state: Editor['state'] }) => boolean) }))
vi.mock('@tiptap/react/menus', () => ({
  BubbleMenu: ({ children, shouldShow }: { children: React.ReactNode; shouldShow: typeof bubble.shouldShow }) => {
    bubble.shouldShow = shouldShow
    return <div>{children}</div>
  },
}))

test('edits, persists and restores public data with lifecycle notifications', async () => {
  let editor: Editor | null = null
  const ready = vi.fn((value: Editor | null) => { editor = value })
  const mounted = render(<TiptapEditor onEditorReady={ready} />)
  await waitFor(() => expect(editor).not.toBeNull())
  expect(bubble.shouldShow?.({ state: editor!.state })).toBe(false)
  act(() => { editor!.commands.insertContent('persisted') })
  const id = editor!.state.doc.firstChild?.attrs.id
  act(() => { editor!.commands.setTextSelection({ from: 2, to: 5 }) })
  expect(bubble.shouldShow?.({ state: editor!.state })).toBe(true)
  expect(JSON.parse(localStorage.getItem('editor-playground:tiptap-blocks')!)[0]).toMatchObject({
    id, type: 'paragraph', content: [{ type: 'text', text: 'persisted', styles: {} }],
  })
  const first = editor!
  mounted.unmount()
  expect(ready).toHaveBeenLastCalledWith(null)
  await waitFor(() => expect(first.isDestroyed).toBe(true))
  render(<TiptapEditor onEditorReady={ready} />)
  await waitFor(() => expect(editor?.state.doc.textContent).toBe('persisted'))
  expect(editor!.state.doc.firstChild?.attrs.id).toBe(id)
})

