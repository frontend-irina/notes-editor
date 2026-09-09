import { Node, mergeAttributes } from '@tiptap/core'

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
