// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { fireEvent, render, screen } from '../../../test/react'
import { createEditor } from '../../../test/create-editor'
import { block, doc } from '../../../test/fixtures'
import { ColorStyleButton } from './ColorStyleButton'

test.each([['textColor', 0], ['backgroundColor', 1]] as const)('applies and clears %s on selection', async (kind, index) => {
  const editor = createEditor(doc(block('a', 'color')))
  editor.commands.setTextSelection({ from: 2, to: 7 })
  render(<ColorStyleButton editor={editor} />)
  const button = screen.getByRole('button', { name: 'Цвет текста и фона' })
  fireEvent.click(button)
  fireEvent.click((await screen.findAllByRole('menuitem', { name: 'Красный' }))[index])
  expect(editor.getAttributes(kind).color).toBe('#d32f2f')
  expect(button).toHaveAttribute('aria-expanded', 'false')
  fireEvent.click(button)
  fireEvent.click((await screen.findAllByRole('menuitem', { name: 'По умолчанию' }))[index])
  expect(editor.isActive(kind)).toBe(false)
})
