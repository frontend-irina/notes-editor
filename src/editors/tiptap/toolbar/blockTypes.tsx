import {
  CheckBoxOutlined,
  FormatListBulletedRounded,
  FormatListNumberedRounded,
  FormatQuoteRounded,
  TextFieldsRounded,
  TitleRounded,
} from '@mui/icons-material'
import type { Editor } from '@tiptap/core'
import type { ReactNode } from 'react'
import type {
  HeadingBlockType,
  ListBlockType,
  SelectableBlockType,
  SelectedBlockType,
} from './types'

export const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const

export const LIST_BLOCKS: Array<{
  type: ListBlockType
  label: string
  shortcut: string
  icon: ReactNode
}> = [
  {
    type: 'bulletListItem',
    label: 'Маркированный список',
    shortcut: 'Mod+Shift+8',
    icon: <FormatListBulletedRounded fontSize="small" />,
  },
  {
    type: 'numberedListItem',
    label: 'Нумерованный список',
    shortcut: 'Mod+Shift+7',
    icon: <FormatListNumberedRounded fontSize="small" />,
  },
  {
    type: 'checkListItem',
    label: 'Список с флажками',
    shortcut: 'Mod+Shift+9',
    icon: <CheckBoxOutlined fontSize="small" />,
  },
]

function selectableTypeFromNode(type: string, level?: unknown): SelectableBlockType | null {
  if (
    type === 'paragraph'
    || type === 'quote'
    || type === 'bulletListItem'
    || type === 'numberedListItem'
    || type === 'checkListItem'
  ) return type
  if (type === 'heading' && HEADING_LEVELS.includes(level as typeof HEADING_LEVELS[number])) {
    return `heading-${level}` as HeadingBlockType
  }
  return null
}

export function getBlockTypeLabel(type: SelectedBlockType) {
  if (type === 'mixed') return 'Несколько типов'
  if (type === 'quote') return 'Цитата'
  if (type?.startsWith('heading-')) return `Заголовок ${type.slice('heading-'.length)}`
  return LIST_BLOCKS.find((item) => item.type === type)?.label ?? 'Параграф'
}

export function getBlockTypeIcon(type: SelectedBlockType) {
  if (type === 'quote') return <FormatQuoteRounded />
  if (type?.startsWith('heading-')) return <TitleRounded />
  return LIST_BLOCKS.find((item) => item.type === type)?.icon ?? <TextFieldsRounded />
}

export function getSelectedBlockType(editor: Editor): SelectedBlockType {
  const { doc, selection } = editor.state
  const selectedTypes = new Set<SelectableBlockType>()

  for (let depth = selection.$from.depth; depth > 0; depth -= 1) {
    const node = selection.$from.node(depth)
    const type = selectableTypeFromNode(node.type.name, node.attrs.level)
    if (type) selectedTypes.add(type)
  }

  doc.nodesBetween(selection.from, selection.to, (node) => {
    const type = selectableTypeFromNode(node.type.name, node.attrs.level)
    if (type) selectedTypes.add(type)
  })

  if (selectedTypes.size === 0) return null
  if (selectedTypes.size > 1) return 'mixed'
  return [...selectedTypes][0]
}
