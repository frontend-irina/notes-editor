import { Node, textblockTypeInputRule } from '@tiptap/core'

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
