import { Node, textblockTypeInputRule } from '@tiptap/core'
import type { HeadingLevel } from '../../types'
import { handleHeadingEnter } from './heading-enter'

export type HeadingOptions = {
  defaultLevel: HeadingLevel
  levels: HeadingLevel[]
}

const HEADING_LEVELS: HeadingLevel[] = [1, 2, 3, 4, 5, 6]

export const Heading = Node.create<HeadingOptions>({
  name: 'heading',
  group: 'blockContent',
  content: 'inline*',
  defining: true,

  addOptions() {
    return {
      defaultLevel: 1,
      levels: [...HEADING_LEVELS],
    }
  },

  addAttributes() {
    return {
      level: {
        default: this.options.defaultLevel,
        parseHTML: (element) => Number(element.tagName.slice(1)),
      },
    }
  },

  parseHTML() {
    return this.options.levels.map((level) => ({ tag: `h${level}` }))
  },

  renderHTML({ node, HTMLAttributes }) {
    const level = this.options.levels.includes(node.attrs.level)
      ? node.attrs.level as HeadingLevel
      : this.options.defaultLevel
    return [`h${level}`, HTMLAttributes, 0]
  },

  addInputRules() {
    return this.options.levels.map((level) => textblockTypeInputRule({
      find: new RegExp(`^(#{${level}})\\s$`),
      type: this.type,
      getAttributes: { level },
    }))
  },

  addKeyboardShortcuts() {
    const levelShortcuts = Object.fromEntries(this.options.levels.map((level) => [
      `Mod-Alt-${level}`,
      () => this.editor.chain().setNode(this.name, { level }).run(),
    ]))

    return {
      ...levelShortcuts,
      Enter: () => handleHeadingEnter(this.editor, this.type),
    }
  },
})
