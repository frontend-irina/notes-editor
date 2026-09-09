import type { Editor } from '@tiptap/core'

export type TiptapToolbarProps = {
  editor: Editor
}

export type HeadingBlockType = `heading-${1 | 2 | 3 | 4 | 5 | 6}`
export type ListBlockType = 'bulletListItem' | 'numberedListItem' | 'checkListItem'
export type SelectableBlockType = 'paragraph' | 'quote' | HeadingBlockType | ListBlockType
export type SelectedBlockType = SelectableBlockType | 'mixed' | null
