import { Extension } from '@tiptap/core'
import { handleQuoteEnter } from '../blocks/quote/quote-enter'
import { nestBlock } from '../blocks/shared/nest-block'
import { unnestBlock } from '../blocks/shared/unnest-block'
import { deleteEmptyBlockAndSelectPrevious } from './delete-empty-block'

export const BlockBehavior = Extension.create({
  name: 'blockBehavior',
  priority: 1_000,
  addKeyboardShortcuts() {
    return {
      Backspace: () => deleteEmptyBlockAndSelectPrevious(this.editor),
      Delete: () => deleteEmptyBlockAndSelectPrevious(this.editor),
      Enter: () => handleQuoteEnter(this.editor),
      Tab: () => nestBlock(this.editor.state, transaction => this.editor.view.dispatch(transaction)),
      'Shift-Tab': () => {
        const transaction = this.editor.state.tr
        if (!unnestBlock(transaction)) return false
        this.editor.view.dispatch(transaction)
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
