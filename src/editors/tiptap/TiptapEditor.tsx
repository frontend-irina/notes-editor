import { Box } from '@mui/material'
import { BubbleMenu } from '@tiptap/react/menus'
import { EditorContent, useEditor } from '@tiptap/react'
import { EditorHistoryActions } from './EditorHistoryActions'
import { BlockMenuView } from './menu'
import { createEditorExtensions } from './editor-extensions'
import { blockToTiptap, tiptapToBlock } from './serialization'
import { TiptapToolbar } from './toolbar'
import { defaultBlockProps, type Block } from './types'
import { uuidV7 } from './uuid'
import './editor.css'
import './blocks/list-types/list-types.css'
import './drag-and-drop/drag-and-drop.css'

export type TiptapEditorProps = {
  initialBlocks?: Block[]
  onChange?: (blocks: Block[]) => void
  className?: string
}

function defaultBlocks(): Block[] {
  return [{
    id: uuidV7(),
    type: 'paragraph',
    props: { ...defaultBlockProps },
    content: [],
    children: [],
  }]
}

export function TiptapEditor({
  initialBlocks,
  onChange,
  className,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: createEditorExtensions(),
    content: {
      type: 'doc',
      content: (initialBlocks?.length ? initialBlocks : defaultBlocks()).map(blockToTiptap),
    },
    onUpdate: ({ editor: currentEditor }) => {
      const blocks = (currentEditor.getJSON().content ?? []).map(tiptapToBlock)
      onChange?.(blocks)
    },
  })

  if (!editor) return null

  return (
    <Box className={['tiptap-editor', className].filter(Boolean).join(' ')}>
      <Box className="tiptap-editor-header">
        <EditorHistoryActions editor={editor} />
      </Box>
      <div className="tiptap-shell">
        <EditorContent editor={editor} />
        <BlockMenuView editor={editor} />
        <BubbleMenu
          className="tiptap-toolbar-layer"
          editor={editor}
          options={{ placement: 'top' }}
          shouldShow={({ state }) => !state.selection.empty}
        >
          <TiptapToolbar editor={editor} />
        </BubbleMenu>
      </div>
    </Box>
  )
}
