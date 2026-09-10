import type { Editor } from '@tiptap/core'
import { BubbleMenu } from '@tiptap/react/menus'
import { EditorContent, useEditor } from '@tiptap/react'
import { useEffect } from 'react'
import { BlockMenuView } from './menu'
import { createEditorExtensions } from './editor-extensions'
import { loadTiptapContent, saveTiptapContent } from './storage'
import { TiptapToolbar } from './toolbar'
import './editor.css'
import './blocks/list-types/list-types.css'
import './drag-and-drop/drag-and-drop.css'

type TiptapEditorProps = {
  onEditorReady: (editor: Editor | null) => void
}

export function TiptapEditor({ onEditorReady }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: createEditorExtensions(),
    content: loadTiptapContent(),
    onUpdate: ({ editor: currentEditor }) => {
      saveTiptapContent(currentEditor.getJSON())
    },
  })

  useEffect(() => {
    onEditorReady(editor)
    return () => onEditorReady(null)
  }, [editor, onEditorReady])

  if (!editor) return null

  return (
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
  )
}
