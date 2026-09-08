import { Node, textblockTypeInputRule } from '@tiptap/core'
import { Fragment, NodeRange, Slice } from '@tiptap/pm/model'
import { TextSelection } from '@tiptap/pm/state'
import type { Transaction } from '@tiptap/pm/state'
import { canJoin, liftTarget, ReplaceAroundStep } from '@tiptap/pm/transform'
import { defaultBlockProps, type HeadingLevel } from '../../types'
import { uuidV7 } from '../../uuid'

export type HeadingOptions = {
  defaultLevel: HeadingLevel
  levels: HeadingLevel[]
}

const HEADING_LEVELS: HeadingLevel[] = [1, 2, 3, 4, 5, 6]

function getBlockDepth($from: TextSelection['$from']) {
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name === 'blockContainer') return depth
  }
  return -1
}

// Matches BlockNote's blockContainer/blockGroup unnesting behavior.
function liftToOuterGroup(transaction: Transaction, range: NodeRange) {
  const itemType = transaction.doc.type.schema.nodes.blockContainer
  const groupType = transaction.doc.type.schema.nodes.blockGroup
  const end = range.end
  const endOfGroup = range.$to.end(range.depth)

  if (end < endOfGroup) {
    const blockBeingLifted = range.parent.child(range.endIndex - 1)
    const hasChildren = blockBeingLifted.lastChild?.type === groupType

    transaction.step(new ReplaceAroundStep(
      end - (hasChildren ? 2 : 1),
      endOfGroup,
      end,
      endOfGroup,
      new Slice(Fragment.from(itemType.create(null, groupType.create())), hasChildren ? 2 : 1, 0),
      hasChildren ? 0 : 1,
      true,
    ))

    range = new NodeRange(
      transaction.doc.resolve(range.$from.pos),
      transaction.doc.resolve(endOfGroup),
      range.depth,
    )
  }

  const target = liftTarget(range)
  if (target === null) return false

  transaction.lift(range, target)
  const joinPosition = transaction.mapping.map(end, -1) - 1
  const $join = transaction.doc.resolve(joinPosition)
  if (
    canJoin(transaction.doc, joinPosition)
    && $join.nodeBefore?.type === $join.nodeAfter?.type
  ) {
    transaction.join(joinPosition)
  }
  transaction.scrollIntoView()
  return true
}

function unnestEmptyHeading(transaction: Transaction) {
  const { $from, $to } = transaction.selection
  const range = $from.blockRange(
    $to,
    (node) => node.childCount > 0 && node.type.name === 'blockGroup',
  )

  if (!range) return false
  if ($from.node(range.depth - 1).type.name !== 'blockContainer') return false
  return liftToOuterGroup(transaction, range)
}

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
      Enter: () => {
        const { state, view } = this.editor
        const { selection } = state
        if (!(selection instanceof TextSelection) || !selection.$from.sameParent(selection.$to)) {
          return false
        }

        const { $from, $to } = selection
        if ($from.parent.type !== this.type) return false

        const blockDepth = getBlockDepth($from)
        if (blockDepth < 0) return false

        const block = $from.node(blockDepth)
        const heading = block.firstChild
        if (heading?.type !== this.type) return false

        const isEmpty = heading.content.size === 0
        if (isEmpty && blockDepth > 1) {
          const transaction = state.tr
          if (!unnestEmptyHeading(transaction)) return false
          view.dispatch(transaction)
          return true
        }

        const fromOffset = $from.parentOffset
        const toOffset = $to.parentOffset
        const before = heading.content.cut(0, fromOffset)
        const after = heading.content.cut(toOffset)
        const childGroup = block.childCount > 1 ? block.child(1) : null
        const blockType = state.schema.nodes.blockContainer
        const paragraphType = state.schema.nodes.paragraph
        const keepHeading = fromOffset === 0 && !isEmpty
        const nextContent = keepHeading
          ? this.type.create({ level: heading.attrs.level }, after)
          : paragraphType.create(null, after)
        const nextAttributes = keepHeading
          ? { ...block.attrs, id: uuidV7() }
          : { ...defaultBlockProps, id: uuidV7() }
        const currentBlock = blockType.create(
          block.attrs,
          this.type.create({ level: heading.attrs.level }, before),
          block.marks,
        )
        const nextBlock = blockType.create(
          nextAttributes,
          [nextContent, ...(childGroup ? [childGroup] : [])],
        )
        const blockPosition = $from.before(blockDepth)
        const transaction = state.tr.replaceWith(
          blockPosition,
          blockPosition + block.nodeSize,
          [currentBlock, nextBlock],
        )
        const nextTextPosition = blockPosition + currentBlock.nodeSize + 2

        view.dispatch(transaction.setSelection(
          TextSelection.near(transaction.doc.resolve(nextTextPosition)),
        ).scrollIntoView())
        return true
      },
    }
  },
})
