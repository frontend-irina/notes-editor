import { Node } from '@tiptap/core'
import { listItemInputRule } from './inputRules'
import { handleListItemEnter } from './listItemEnter'

export const BulletListItem = Node.create({
  name: 'bulletListItem',
  group: 'blockContent',
  content: 'inline*',
  defining: true,

  parseHTML: () => [{ tag: 'li[data-list-type="bullet"]' }],
  renderHTML: ({ HTMLAttributes }) => [
    'div',
    { ...HTMLAttributes, 'data-list-type': 'bullet', class: 'tiptap-list-item' },
    0,
  ],

  addInputRules() {
    return [listItemInputRule({
      find: /^\s?[-+*]\s$/,
      type: this.type,
      excludeHeading: true,
    })]
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => handleListItemEnter(this.editor, this.name),
      'Mod-Shift-8': () => this.editor.chain().setNode(this.name).run(),
    }
  },
})
