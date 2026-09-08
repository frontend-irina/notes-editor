import { Node } from '@tiptap/core'
import { listItemInputRule } from './inputRules'
import { handleListItemEnter } from './listItemEnter'

export const NumberedListItem = Node.create({
  name: 'numberedListItem',
  group: 'blockContent',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return {
      start: {
        default: null,
        parseHTML: (element) => {
          const value = Number(element.getAttribute('data-start'))
          return Number.isFinite(value) && value !== 1 ? value : null
        },
      },
    }
  },

  parseHTML: () => [{ tag: 'li[data-list-type="numbered"]' }],
  renderHTML({ node, HTMLAttributes }) {
    const start = typeof node.attrs.start === 'number' ? node.attrs.start : null
    return [
      'div',
      {
        ...HTMLAttributes,
        'data-list-type': 'numbered',
        ...(start !== null ? { 'data-start': start } : {}),
        ...(start !== null ? { style: `counter-set: tiptap-numbered-list ${start - 1}` } : {}),
        class: 'tiptap-list-item',
      },
      0,
    ]
  },

  addInputRules() {
    return [listItemInputRule({
      find: /^\s?(\d+)\.\s$/,
      type: this.type,
      excludeHeading: true,
      getAttributes: (match) => {
        const start = Number(match[1])
        return { start: start === 1 ? null : start }
      },
    })]
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => handleListItemEnter(this.editor, this.name),
      'Mod-Shift-7': () => this.editor.chain().setNode(this.name).run(),
    }
  },
})
