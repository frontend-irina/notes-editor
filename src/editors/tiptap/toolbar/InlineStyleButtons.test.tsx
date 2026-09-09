// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { fireEvent, render, screen } from '../../../test/react'
import { createEditor } from '../../../test/create-editor'
import { block, doc } from '../../../test/fixtures'
import { InlineStyleButtons } from './InlineStyleButtons'

test.each([['Полужирный', 'bold'], ['Курсив', 'italic'], ['Подчёркивание', 'underline'], ['Зачёркивание', 'strike']])(
  'toggles %s on the selected text', (label, mark) => {
    const editor = createEditor(doc(block('a', 'abcd')))
    editor.commands.setTextSelection({ from: 3, to: 5 })
    render(<InlineStyleButtons editor={editor} state={{ bold: false, italic: false, underline: false, strike: false }} />)
    fireEvent.click(screen.getByRole('button', { name: label }))
    expect(editor.state.doc.firstChild?.firstChild?.child(1).marks[0].type.name).toBe(mark)
    expect(editor.state.doc.firstChild?.firstChild?.child(0).marks).toEqual([])
    fireEvent.click(screen.getByRole('button', { name: label }))
    expect(editor.state.doc.firstChild?.firstChild?.childCount).toBe(1)
  },
)

