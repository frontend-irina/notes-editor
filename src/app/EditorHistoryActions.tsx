import { RedoRounded, UndoRounded } from '@mui/icons-material'
import { Box, IconButton, Tooltip } from '@mui/material'
import type { Editor } from '@tiptap/core'
import { useEditorState } from '@tiptap/react'

type EditorHistoryActionsProps = { editor: Editor | null }

export function EditorHistoryActions({ editor }: EditorHistoryActionsProps) {
  const historyState = useEditorState({
    editor,
    selector: ({ editor }) => ({
      canUndo: editor?.can().undo() ?? false,
      canRedo: editor?.can().redo() ?? false,
    }),
  })

  return (
    <Box
      className="tabs-history-actions"
      aria-label="История изменений Tiptap"
    >
      <Tooltip title="Отменить">
        <span>
          <IconButton
            size="small"
            disabled={!historyState?.canUndo}
            onClick={() => editor?.chain().focus().undo().run()}
            aria-label="Отменить"
          >
            <UndoRounded />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Повторить">
        <span>
          <IconButton
            size="small"
            disabled={!historyState?.canRedo}
            onClick={() => editor?.chain().focus().redo().run()}
            aria-label="Повторить"
          >
            <RedoRounded />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  )
}
