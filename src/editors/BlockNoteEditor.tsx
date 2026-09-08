import type { PartialBlock } from '@blocknote/core'
import '@blocknote/core/fonts/inter.css'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import { useCreateBlockNote } from '@blocknote/react'
import { Alert } from '@mui/material'

const STORAGE_KEY = 'editor-playground:blocknote'

const defaultContent: PartialBlock[] = [
  {
    type: 'heading',
    props: { level: 2 },
    content: 'Добро пожаловать в BlockNote',
  },
  {
    type: 'paragraph',
    content: 'Это блочный редактор. Начните печатать или введите /, чтобы открыть меню блоков.',
  },
]

function getInitialContent(): PartialBlock[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? (JSON.parse(saved) as PartialBlock[]) : defaultContent
  } catch {
    return defaultContent
  }
}

export function BlockNoteEditor() {
  const storageAvailable = typeof localStorage !== 'undefined'
  const editor = useCreateBlockNote({ initialContent: getInitialContent() })

  return (
    <>
      {!storageAvailable && (
        <Alert severity="warning">Браузер не разрешил доступ к локальному хранилищу.</Alert>
      )}
      <BlockNoteView
        editor={editor}
        theme="light"
        onChange={() => {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(editor.document))
          } catch {
            // Editing still works when localStorage is unavailable or full.
          }
        }}
      />
    </>
  )
}
