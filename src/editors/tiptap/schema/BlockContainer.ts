import { Node, mergeAttributes } from '@tiptap/core'

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
