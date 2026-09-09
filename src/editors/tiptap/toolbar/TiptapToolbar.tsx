import {
  FormatAlignCenterRounded,
  FormatAlignLeftRounded,
  FormatAlignRightRounded,
  FormatBoldRounded,
  FormatItalicRounded,
  FormatUnderlinedRounded,
  LinkRounded,
  StrikethroughSRounded,
} from '@mui/icons-material'
import { Divider } from '@mui/material'
import { useEditorState } from '@tiptap/react'
import { BlockTypeSelect } from './BlockTypeSelect'
import { getSelectedBlockType } from './blockTypes'
import { ColorStyleButton } from './ColorStyleButton'
import { ToolbarButton } from './ToolbarButton'
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

  const setAlignment = (textAlignment: 'left' | 'center' | 'right') => {
    editor.chain().focus().updateAttributes('blockContainer', { textAlignment }).run()
  }

  const editLink = () => {
    const currentHref = String(editor.getAttributes('link').href ?? '')
    const href = window.prompt('Адрес ссылки', currentHref)
    if (href === null) return
    if (href.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run()
  }

  return (
    <div className="tiptap-toolbar" role="toolbar" aria-label="Форматирование текста">
      <BlockTypeSelect editor={editor} selectedType={state.blockType} />
      <Divider orientation="vertical" flexItem />
      <ToolbarButton
        label="Полужирный"
        shortcut="Mod+B"
        icon={<FormatBoldRounded />}
        selected={state.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label="Курсив"
        shortcut="Mod+I"
        icon={<FormatItalicRounded />}
        selected={state.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label="Подчёркивание"
        shortcut="Mod+U"
        icon={<FormatUnderlinedRounded />}
        selected={state.underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolbarButton
        label="Зачёркивание"
        shortcut="Mod+Shift+S"
        icon={<StrikethroughSRounded />}
        selected={state.strike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <Divider orientation="vertical" flexItem />
      {state.blockType !== 'quote' && (
        <>
          <ToolbarButton
            label="Выровнять слева"
            icon={<FormatAlignLeftRounded />}
            selected={state.left}
            onClick={() => setAlignment('left')}
          />
          <ToolbarButton
            label="Выровнять по центру"
            icon={<FormatAlignCenterRounded />}
            selected={state.center}
            onClick={() => setAlignment('center')}
          />
          <ToolbarButton
            label="Выровнять справа"
            icon={<FormatAlignRightRounded />}
            selected={state.right}
            onClick={() => setAlignment('right')}
          />
          <Divider orientation="vertical" flexItem />
        </>
      )}
      <ColorStyleButton editor={editor} />
      <ToolbarButton
        label={state.link ? 'Изменить ссылку' : 'Создать ссылку'}
        shortcut="Mod+K"
        icon={<LinkRounded />}
        selected={state.link}
        onClick={editLink}
      />
    </div>
  )
}
