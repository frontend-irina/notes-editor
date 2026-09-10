import { Extension } from '@tiptap/core'
import { handleQuoteEnter } from '../blocks/quote/quote-enter'
import { deleteEmptyBlockAndSelectPrevious } from './delete-empty-block'

export const BlockBehavior = Extension.create({
  name: 'blockBehavior',
  priority: 1_000,
  addKeyboardShortcuts() {
    return {
      Backspace: () => deleteEmptyBlockAndSelectPrevious(this.editor),
      Delete: () => deleteEmptyBlockAndSelectPrevious(this.editor),
      Enter: () => handleQuoteEnter(this.editor),
      'Mod-Alt-q': () => this.editor
        .chain()
        .setNode('quote')
        .updateAttributes('blockContainer', { textAlignment: 'left' })
        .run(),
    }
  },
})
