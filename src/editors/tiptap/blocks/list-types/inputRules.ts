import { InputRule, type InputRuleFinder } from '@tiptap/core'
import type { NodeType } from '@tiptap/pm/model'

export function listItemInputRule({
  find,
  type,
  getAttributes = () => ({}),
  excludeHeading = false,
}: {
  find: InputRuleFinder
  type: NodeType
  getAttributes?: (match: RegExpMatchArray) => Record<string, unknown>
  excludeHeading?: boolean
}) {
  return new InputRule({
    find,
    handler: ({ state, range, match }) => {
      const $start = state.doc.resolve(range.from)
      if (excludeHeading && $start.parent.type.name === 'heading') return null
      if (!$start.node(-1).canReplaceWith($start.index(-1), $start.indexAfter(-1), type)) {
        return null
      }

      state.tr
        .delete(range.from, range.to)
        .setBlockType(range.from, range.from, type, getAttributes(match))
    },
  })
}
