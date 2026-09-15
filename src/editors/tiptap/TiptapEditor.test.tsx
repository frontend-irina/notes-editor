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

test('loads initial blocks and emits public data with lifecycle notifications', async () => {
  const changed = vi.fn()
  const mounted = render(<TiptapEditor
    initialBlocks={[{
      id: 'initial',
      type: 'paragraph',
      props: { backgroundColor: 'default', textColor: 'default', textAlignment: 'left' },
      content: [{ type: 'text', text: 'initial', styles: {} }],
      children: [],
    }]}
    onChange={changed}
  />)
  let editor: Editor | undefined
  await waitFor(() => {
    editor = (mounted.container.querySelector('.tiptap') as HTMLElement & { editor?: Editor })?.editor
    expect(editor).toBeDefined()
  })
  const activeEditor = editor!
  expect(activeEditor.state.doc.textContent).toBe('initial')
  expect(bubble.shouldShow?.({ state: activeEditor.state })).toBe(false)
  act(() => { activeEditor.commands.focus('end'); activeEditor.commands.insertContent(' updated') })
  act(() => { activeEditor.commands.setTextSelection({ from: 2, to: 5 }) })
  expect(bubble.shouldShow?.({ state: activeEditor.state })).toBe(true)
  expect(changed.mock.lastCall?.[0][0]).toMatchObject({
    id: 'initial', type: 'paragraph', content: [{ type: 'text', text: 'initial updated', styles: {} }],
  })
  mounted.unmount()
  await waitFor(() => expect(activeEditor.isDestroyed).toBe(true))
})
