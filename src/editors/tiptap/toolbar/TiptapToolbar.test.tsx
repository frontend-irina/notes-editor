// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { act, render, screen } from '../../../test/react'
import { createEditor } from '../../../test/create-editor'
import { block, doc } from '../../../test/fixtures'
import { TiptapToolbar } from './TiptapToolbar'

test('subscribes to editor formatting and hides alignment for quotes', () => {
  const editor = createEditor(doc(block('a', 'text')))
  const rendered = render(<TiptapToolbar editor={editor} />)
  expect(screen.getByRole('toolbar', { name: 'Форматирование текста' })).toBeInTheDocument()
  act(() => { editor.commands.setTextSelection({ from: 2, to: 6 }); editor.commands.toggleBold() })
  expect(screen.getByRole('button', { name: 'Полужирный' })).toHaveAttribute('aria-pressed', 'true')
  act(() => { editor.commands.setNode('quote') })
  expect(screen.queryByRole('button', { name: 'Выровнять слева' })).toBeNull()
  rendered.unmount()
  expect(() => editor.commands.insertContent('x')).not.toThrow()
})

