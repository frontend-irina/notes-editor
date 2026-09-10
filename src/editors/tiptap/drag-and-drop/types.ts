import type { Node as ProseMirrorNode, Slice } from '@tiptap/pm/model'
import type { EditorView } from '@tiptap/pm/view'

export type BlockRange = {
  from: number
  to: number
  node: ProseMirrorNode
}

export type ActiveDrag = BlockRange & {
  source: EditorView
  slice: Slice
  preview: HTMLElement | null
}

export type DropCursorState = { pos: number | null }
