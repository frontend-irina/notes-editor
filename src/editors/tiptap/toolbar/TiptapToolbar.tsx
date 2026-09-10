import { Divider } from '@mui/material'
import { useEditorState } from '@tiptap/react'
import { BlockTypeSelect } from './BlockTypeSelect'
import { getSelectedBlockType } from './blockTypes'
import { ColorStyleButton } from './ColorStyleButton'
import { InlineStyleButtons } from './InlineStyleButtons'
import { AlignmentButtons } from './AlignmentButtons'
import { LinkButton } from './LinkButton'
import type { TiptapToolbarProps } from './types'
import './toolbar.css'

export function TiptapToolbar({ editor }: TiptapToolbarProps) {
  const state = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      bold: currentEditor.isActive('bold'),
      italic: currentEditor.isActive('italic'),
      underline: currentEditor.isActive('underline'),
      strike: currentEditor.isActive('strike'),
      left: currentEditor.isActive('blockContainer', { textAlignment: 'left' }),
      center: currentEditor.isActive('blockContainer', { textAlignment: 'center' }),
      right: currentEditor.isActive('blockContainer', { textAlignment: 'right' }),
      link: currentEditor.isActive('link'),
      blockType: getSelectedBlockType(currentEditor),
    }),
  })

  return (
    <div className="tiptap-toolbar" role="toolbar" aria-label="Форматирование текста">
      <BlockTypeSelect editor={editor} selectedType={state.blockType} />
      <Divider orientation="vertical" flexItem />
      <InlineStyleButtons editor={editor} state={state} />
      <Divider orientation="vertical" flexItem />
      {state.blockType !== 'quote' && (
        <>
          <AlignmentButtons editor={editor} state={state} />
          <Divider orientation="vertical" flexItem />
        </>
      )}
      <ColorStyleButton editor={editor} />
      <LinkButton editor={editor} selected={state.link} />
    </div>
  )
}
