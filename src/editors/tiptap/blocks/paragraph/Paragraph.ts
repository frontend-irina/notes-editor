import { Node } from '@tiptap/core'
import { handleParagraphEnter } from './paragraph-enter'

export const Paragraph = Node.create({
  name: 'paragraph',
  group: 'blockContent',
  content: 'inline*',
  defining: true,
  parseHTML: () => [{ tag: 'p' }],
  renderHTML: ({ HTMLAttributes }) => ['p', HTMLAttributes, 0],

  addKeyboardShortcuts() {
    return {
      Enter: () => handleParagraphEnter(this.editor, this.type),
      'Mod-Alt-0': () => this.editor.chain().setNode(this.name).run(),
    }
  },
})
