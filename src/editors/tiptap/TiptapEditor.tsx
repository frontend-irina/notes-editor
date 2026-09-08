import type { Editor } from '@tiptap/core'
import { BubbleMenu } from '@tiptap/react/menus'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'
import { Heading } from './blocks/heading'
import { Paragraph } from './blocks/paragraph'
import {
  BackgroundColor,
  BlockContainer,
  BlockDocument,
  BlockGroup,
  BlockIds,
  BlockBehavior,
  Quote,
  TextColor,
} from './extensions'
import { loadTiptapContent, saveTiptapContent } from './storage'
import { TiptapToolbar } from './TiptapToolbar'

type TiptapEditorProps = {
  onEditorReady: (editor: Editor | null) => void
}

export function TiptapEditor({ onEditorReady }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        document: false,
        blockquote: false,
        heading: false,
        paragraph: false,
      }),
      BlockDocument,
      BlockGroup,
      BlockContainer,
      Paragraph,
      Heading,
      Quote,
      BlockIds,
      BlockBehavior,
      TextColor,
      BackgroundColor,
    ],
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
      <BubbleMenu
        editor={editor}
        options={{ placement: 'top' }}
        shouldShow={({ state }) => !state.selection.empty}
      >
        <TiptapToolbar editor={editor} />
      </BubbleMenu>
    </div>
  )
}
