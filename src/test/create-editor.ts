import { Editor, getSchema, type EditorOptions, type JSONContent } from '@tiptap/core'
import { EditorState, TextSelection } from '@tiptap/pm/state'
import { afterEach } from 'vitest'
import { createEditorExtensions } from '../editors/tiptap/editor-extensions'
import { endDrag } from '../editors/tiptap/drag-and-drop/drag-session'
import { block, doc } from './fixtures'

export const schema = getSchema(createEditorExtensions())
const editors: Editor[] = []

export function createState(content = doc(block()), position = 2) {
  const document = schema.nodeFromJSON(content)
  return EditorState.create({ schema, doc: document, selection: TextSelection.create(document, position) })
}

export function createEditor(content: JSONContent = doc(block()), position = 2, options: Partial<EditorOptions> = {}) {
  const element = document.createElement('div')
  document.body.append(element)
  const editor = new Editor({ element, extensions: createEditorExtensions(), content, ...options })
  editor.commands.setTextSelection(position)
  editors.push(editor)
  return editor
}

export function destroyTestEditors() {
  endDrag()
  for (const editor of editors.splice(0)) {
    const element = editor.options.element
    editor.destroy()
    if (element instanceof HTMLElement) element.remove()
  }
}

afterEach(destroyTestEditors)
