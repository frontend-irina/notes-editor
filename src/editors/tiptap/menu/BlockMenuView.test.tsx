// @vitest-environment jsdom
import { expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen } from '../../../test/react'
import { createEditor } from '../../../test/create-editor'
import { openMenuForBlock } from './menu-commands'
import { BlockMenuView } from './BlockMenuView'

test('renders groups and selected items only while open and executes a click', () => {
  const editor = createEditor()
  vi.spyOn(editor.view, 'coordsAtPos').mockReturnValue({ left: 20, right: 20, top: 20, bottom: 40 })
  render(<BlockMenuView editor={editor} />)
  expect(screen.queryByRole('menu')).toBeNull()
  act(() => openMenuForBlock(editor.view, 'a'))
  expect(screen.getByRole('menu', { name: 'Добавление блока' })).toBeInTheDocument()
  expect(screen.getAllByRole('menuitem')[0]).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByText('Заголовки')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('menuitem', { name: /Цитата Цитата или отрывок/ }))
  expect(editor.state.doc.firstChild?.firstChild?.type.name).toBe('quote')
  expect(screen.queryByRole('menu')).toBeNull()
})
test('shows an empty result state for unmatched queries', () => {
  const editor = createEditor()
  vi.spyOn(editor.view, 'coordsAtPos').mockReturnValue({ left: 20, right: 20, top: 20, bottom: 40 })
  render(<BlockMenuView editor={editor} />)
  act(() => { openMenuForBlock(editor.view, 'a'); editor.commands.insertContent('impossible') })
  expect(screen.getByRole('menuitem', { name: 'Команды не найдены' })).toHaveAttribute('aria-disabled', 'true')
})

