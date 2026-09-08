import { Extension, Mark, Node, mergeAttributes, textblockTypeInputRule } from '@tiptap/core'
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import { defaultBlockProps } from './types'
import { uuidV7 } from './uuid'

export const TextColor = Mark.create({
  name: 'textColor',
  addAttributes: () => ({ color: { default: 'default' } }),
  parseHTML: () => [{
    tag: 'span[data-text-color]',
    getAttrs: (element) => ({ color: (element as HTMLElement).dataset.textColor }),
  }],
  renderHTML: ({ HTMLAttributes }) => [
    'span',
    { 'data-text-color': HTMLAttributes.color, style: `color: ${HTMLAttributes.color}` },
    0,
  ],
})

export const BackgroundColor = Mark.create({
  name: 'backgroundColor',
  addAttributes: () => ({ color: { default: 'default' } }),
  parseHTML: () => [{
    tag: 'span[data-background-color]',
    getAttrs: (element) => ({ color: (element as HTMLElement).dataset.backgroundColor }),
  }],
  renderHTML: ({ HTMLAttributes }) => [
    'span',
    {
      'data-background-color': HTMLAttributes.color,
      style: `background-color: ${HTMLAttributes.color}`,
    },
    0,
  ],
})

export const BlockGroup = Node.create({
  name: 'blockGroup',
  group: 'blockGroup',
  content: 'blockContainer+',
  parseHTML: () => [{ tag: 'div[data-node-type="blockGroup"]' }],
  renderHTML: ({ HTMLAttributes }) => [
    'div',
    mergeAttributes(HTMLAttributes, {
      'data-node-type': 'blockGroup',
      class: 'tiptap-block-group',
    }),
    0,
  ],
})

export const BlockContainer = Node.create({
  name: 'blockContainer',
  group: 'block',
  content: '(paragraph | heading | quote | bulletListItem | numberedListItem | checkListItem) blockGroup?',
  defining: true,
  addAttributes() {
    return {
      id: { default: null },
      backgroundColor: { default: 'default' },
      textColor: { default: 'default' },
      textAlignment: { default: 'left' },
    }
  },
  parseHTML: () => [{ tag: 'div[data-node-type="blockContainer"]' }],
  renderHTML({ node, HTMLAttributes }) {
    const { id, backgroundColor, textColor, textAlignment } = node.attrs
    const style = [
      backgroundColor !== 'default' && `background-color: ${backgroundColor}`,
      textColor !== 'default' && `color: ${textColor}`,
      textAlignment !== 'left' && `text-align: ${textAlignment}`,
    ].filter(Boolean).join('; ')

    return ['div', mergeAttributes(HTMLAttributes, {
      'data-node-type': 'blockContainer',
      'data-id': id,
      'data-background-color': backgroundColor,
      'data-text-color': textColor,
      'data-text-alignment': textAlignment,
      class: 'tiptap-block',
      ...(style ? { style } : {}),
    }), 0]
  },
})

export const Quote = Node.create({
  name: 'quote',
  group: 'blockContent',
  content: 'inline*',
  defining: true,
  parseHTML: () => [{ tag: 'blockquote' }],
  renderHTML: ({ HTMLAttributes }) => ['blockquote', HTMLAttributes, 0],
  addInputRules() {
    return [
      textblockTypeInputRule({ find: /^>\s$/, type: this.type }),
      textblockTypeInputRule({ find: /^\p{Quotation_Mark}\s$/u, type: this.type }),
    ]
  },
})

export const BlockDocument = Node.create({
  name: 'doc',
  topNode: true,
  content: 'blockContainer+',
})

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

function currentBlockDepth($from: TextSelection['$from']) {
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name === 'blockContainer') return depth
  }
  return -1
}

export const BlockBehavior = Extension.create({
  name: 'blockBehavior',
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { state, view } = this.editor
        const { $from } = state.selection
        const blockDepth = currentBlockDepth($from)
        if (blockDepth < 0) return false

        const block = $from.node(blockDepth)
        const blockContent = block.firstChild
        if (!blockContent || blockContent.type.name !== 'quote') return false

        const offset = $from.parentOffset
        const before = blockContent.content.cut(0, offset)
        const after = blockContent.content.cut(offset)
        const contentType = blockContent.type
        const blockType = state.schema.nodes.blockContainer
        const nextBlock = blockType.create(
          {
            ...defaultBlockProps,
            backgroundColor: block.attrs.backgroundColor,
            textColor: block.attrs.textColor,
            textAlignment: blockContent.type.name === 'quote' ? 'left' : block.attrs.textAlignment,
            id: uuidV7(),
          },
          contentType.create(null, after),
        )
        const currentBlock = blockType.create(
          block.attrs,
          [
            contentType.create(null, before),
            ...(block.childCount > 1 ? [block.child(1)] : []),
          ],
          block.marks,
        )
        const from = $from.before(blockDepth)
        const transaction = state.tr.replaceWith(
          from,
          from + block.nodeSize,
          [currentBlock, nextBlock],
        )
        const nextTextPosition = from + currentBlock.nodeSize + 2
        view.dispatch(
          transaction.setSelection(TextSelection.near(transaction.doc.resolve(nextTextPosition))),
        )
        return true
      },
      'Mod-Alt-q': () => this.editor
        .chain()
        .setNode('quote')
        .updateAttributes('blockContainer', { textAlignment: 'left' })
        .run(),
    }
  },
})
