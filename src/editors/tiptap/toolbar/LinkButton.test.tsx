// @vitest-environment jsdom
import { expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '../../../test/react'
import { createEditor } from '../../../test/create-editor'
import { block, doc } from '../../../test/fixtures'
import { LinkButton } from './LinkButton'

test.each([null, '', '  https://example.com  '])('handles prompt value %s', href => {
  const editor = createEditor(doc(block('a', 'link')))
  editor.commands.setTextSelection({ from: 2, to: 6 })
  editor.commands.setLink({ href: 'https://old.example' })
  const prompt = vi.spyOn(window, 'prompt').mockReturnValue(href)
  render(<LinkButton editor={editor} selected />)
  fireEvent.click(screen.getByRole('button', { name: 'Изменить ссылку' }))
  expect(prompt).toHaveBeenCalledWith('Адрес ссылки', 'https://old.example')
  expect(editor.getAttributes('link').href).toBe(href === null ? 'https://old.example' : href.trim() || undefined)
  expect(editor.state.doc.textContent).toBe('link')
})

