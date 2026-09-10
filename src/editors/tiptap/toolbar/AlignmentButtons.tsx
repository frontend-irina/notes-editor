import { FormatAlignCenterRounded, FormatAlignLeftRounded, FormatAlignRightRounded } from '@mui/icons-material'
import { ToolbarButton } from './ToolbarButton'
import type { TiptapToolbarProps } from './types'

type AlignmentButtonsProps = TiptapToolbarProps & {
  state: { left: boolean; center: boolean; right: boolean }
}

export function AlignmentButtons({ editor, state }: AlignmentButtonsProps) {
  const setAlignment = (textAlignment: 'left' | 'center' | 'right') => {
    editor.chain().focus().updateAttributes('blockContainer', { textAlignment }).run()
  }

  return (
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
    </>
  )
}
