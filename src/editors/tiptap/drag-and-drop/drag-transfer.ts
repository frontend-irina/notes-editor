import { DOMSerializer } from '@tiptap/pm/model'
import type { EditorView } from '@tiptap/pm/view'
import type { BlockRange } from './types'

export function createPreview(view: EditorView, range: BlockRange) {
  const wrapper = document.createElement('div')
  wrapper.className = 'tiptap-block-drag-preview'
  const serializer = DOMSerializer.fromSchema(view.state.schema)
  wrapper.appendChild(serializer.serializeFragment(view.state.doc.slice(range.from, range.to).content))
  wrapper.querySelectorAll('iframe, embed, object').forEach((element) => element.remove())
  document.body.appendChild(wrapper)
  return wrapper
}

export function serializeRange(view: EditorView, range: BlockRange) {
  const wrapper = document.createElement('div')
  const serializer = DOMSerializer.fromSchema(view.state.schema)
  wrapper.appendChild(serializer.serializeFragment(view.state.doc.slice(range.from, range.to).content))
  return { html: wrapper.innerHTML, text: wrapper.textContent ?? '' }
}
