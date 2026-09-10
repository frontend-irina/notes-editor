import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { uuidV7 } from '../uuid'

const blockIdPluginKey = new PluginKey('block-id-v7')

export const BlockIds = Extension.create({
  name: 'blockIds',
  addProseMirrorPlugins() {
    return [new Plugin({
      key: blockIdPluginKey,
      appendTransaction: (_transactions, _oldState, newState) => {
        const seen = new Set<string>()
        const replacements: Array<{ pos: number; id: string }> = []

        newState.doc.descendants((node, pos) => {
          if (node.type.name !== 'blockContainer') return
          const id = typeof node.attrs.id === 'string' ? node.attrs.id : ''
          if (!id || seen.has(id)) replacements.push({ pos, id: uuidV7() })
          else seen.add(id)
        })

        if (!replacements.length) return null

        const transaction = newState.tr
        for (const replacement of replacements) {
          const node = transaction.doc.nodeAt(replacement.pos)
          if (node?.type.name === 'blockContainer') {
            transaction.setNodeMarkup(replacement.pos, undefined, {
              ...node.attrs,
              id: replacement.id,
            })
          }
        }
        return transaction.setMeta(blockIdPluginKey, true)
      },
    })]
  },
})
