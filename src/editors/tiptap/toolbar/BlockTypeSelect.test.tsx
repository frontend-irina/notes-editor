// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { fireEvent, render, screen } from '../../../test/react'
import { createEditor } from '../../../test/create-editor'
import { BlockTypeSelect } from './BlockTypeSelect'

test('opens all block options and applies a heading', async () => {
  const editor = createEditor()
  render(<BlockTypeSelect editor={editor} selectedType="paragraph" />)
  const button = screen.getByRole('button', { name: 'Тип блока: Параграф' })
  fireEvent.click(button)
  expect(button).toHaveAttribute('aria-expanded', 'true')
  expect(await screen.findAllByRole('menuitem')).toHaveLength(11)
  fireEvent.click(screen.getByRole('menuitem', { name: 'Заголовок 3, Mod+Alt+3' }))
  expect(editor.state.doc.firstChild?.firstChild?.attrs.level).toBe(3)
  expect(button).toHaveAttribute('aria-expanded', 'false')
})
