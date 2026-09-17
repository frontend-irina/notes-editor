import { Extension, type JSONContent } from '@tiptap/core'
import { Fragment, Slice, type Schema } from '@tiptap/pm/model'
import { Plugin } from '@tiptap/pm/state'
import { getBlockNestingDepth } from '../blocks/shared/block-position'
import { normalizeBlockDepth } from '../persistence'
import { blockToTiptap, tiptapToBlock } from '../serialization'

export function normalizePastedSlice(slice: Slice, schema: Schema, insertionDepth: number) {
  const nodes = [...Array.from({ length: slice.content.childCount }, (_, index) => slice.content.child(index))]
  if (nodes.length === 0 || nodes.some((node) => node.type.name !== 'blockContainer')) return slice

  const blocks = nodes.map((node) => tiptapToBlock(node.toJSON() as JSONContent))
  const normalized = normalizeBlockDepth(blocks, insertionDepth)
  const content = normalized.map((block) => schema.nodeFromJSON(blockToTiptap(block)))
  return new Slice(Fragment.fromArray(content), 0, 0)
}

export const PasteDepthLimit = Extension.create({
  name: 'pasteDepthLimit',

  addProseMirrorPlugins() {
    return [new Plugin({
      props: {
        transformPasted: (slice) => normalizePastedSlice(
          slice,
          this.editor.schema,
          Math.max(1, getBlockNestingDepth(this.editor.state.selection.$from)),
        ),
      },
    })]
  },
})
