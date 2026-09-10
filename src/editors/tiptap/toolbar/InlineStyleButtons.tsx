import { FormatBoldRounded, FormatItalicRounded, FormatUnderlinedRounded, StrikethroughSRounded } from '@mui/icons-material'
import { ToolbarButton } from './ToolbarButton'
import type { TiptapToolbarProps } from './types'

type InlineStyleButtonsProps = TiptapToolbarProps & {
  state: { bold: boolean; italic: boolean; underline: boolean; strike: boolean }
}

export function InlineStyleButtons({ editor, state }: InlineStyleButtonsProps) {
  return (
    <>
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
    </>
  )
}
