// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { fireEvent, render, screen } from '../../../test/react'
import { createEditor } from '../../../test/create-editor'
import { AlignmentButtons } from './AlignmentButtons'

test.each([['Выровнять слева', 'left'], ['Выровнять по центру', 'center'], ['Выровнять справа', 'right']])(
  'applies %s to container props', (label, alignment) => {
    const editor = createEditor()
    render(<AlignmentButtons editor={editor} state={{ left: true, center: false, right: false }} />)
    fireEvent.click(screen.getByRole('button', { name: label }))
    expect(editor.state.doc.firstChild?.attrs.textAlignment).toBe(alignment)
  },
)

