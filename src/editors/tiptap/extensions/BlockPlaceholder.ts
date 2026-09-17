import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export const BlockPlaceholder = Extension.create<{ placeholder: string }>({
  name: 'blockPlaceholder',

  addOptions() {
    return { placeholder: 'Начните писать...' }
  },

  addProseMirrorPlugins() {
    return [new Plugin({
      props: {
        decorations: ({ doc, selection }) => {
          const decorations: Decoration[] = []
          doc.descendants((node, position) => {
            if (
              node.isTextblock
              && node.content.size === 0
              && selection.$from.parent === node
            ) {
              decorations.push(Decoration.node(position, position + node.nodeSize, {
                class: 'tiptap-empty-block',
                'data-placeholder': this.options.placeholder,
              }))
            }
          })
          return DecorationSet.create(doc, decorations)
        },
      },
    })]
  },
})
