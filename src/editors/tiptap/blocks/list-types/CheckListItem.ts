import { Node, textblockTypeInputRule } from '@tiptap/core'
import { handleListItemEnter } from './listItemEnter'

export const CheckListItem = Node.create({
  name: 'checkListItem',
  group: 'blockContent',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return {
      checked: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-checked') === 'true',
      },
    }
  },

  parseHTML: () => [{ tag: 'li[data-list-type="check"]' }],
  renderHTML: ({ node, HTMLAttributes }) => [
    'div',
    {
      ...HTMLAttributes,
      'data-list-type': 'check',
      'data-checked': String(node.attrs.checked),
      class: 'tiptap-list-item tiptap-check-list-item',
    },
    0,
  ],

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement('div')
      dom.className = 'tiptap-list-item tiptap-check-list-item'
      dom.dataset.listType = 'check'
      dom.dataset.checked = String(node.attrs.checked)

      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.contentEditable = 'false'
      checkbox.checked = Boolean(node.attrs.checked)
      checkbox.disabled = !editor.isEditable

      const contentDOM = document.createElement('span')
      contentDOM.className = 'tiptap-list-item-content'
      dom.append(checkbox, contentDOM)

      checkbox.addEventListener('change', () => {
        if (!editor.isEditable || typeof getPos !== 'function') return
        const position = getPos()
        if (typeof position !== 'number') return
        editor.view.dispatch(editor.state.tr.setNodeMarkup(position, undefined, {
          ...node.attrs,
          checked: checkbox.checked,
        }))
      })

      return {
        dom,
        contentDOM,
        update: (updatedNode) => {
          if (updatedNode.type !== node.type) return false
          node = updatedNode
          checkbox.checked = Boolean(node.attrs.checked)
          checkbox.disabled = !editor.isEditable
          dom.dataset.checked = String(node.attrs.checked)
          return true
        },
      }
    }
  },

  addInputRules() {
    return [
      textblockTypeInputRule({
        find: /^\s?\[\s*\]\s$/,
        type: this.type,
        getAttributes: { checked: false },
      }),
      textblockTypeInputRule({
        find: /^\s?\[[Xx]\]\s$/,
        type: this.type,
        getAttributes: { checked: true },
      }),
    ]
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => handleListItemEnter(this.editor, this.name),
      'Mod-Shift-9': () => this.editor.chain().setNode(this.name).run(),
    }
  },
})
