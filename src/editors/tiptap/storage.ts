import type { JSONContent } from '@tiptap/core'
import { blockToTiptap, tiptapBlockToBlockNote } from './serialization'
import { defaultBlockProps, type Block } from './types'
import { uuidV7 } from './uuid'

const STORAGE_KEY = 'editor-playground:tiptap-blocks'

function createDefaultBlocks(): Block[] {
  return [{
    id: uuidV7(),
    type: 'paragraph',
    props: { ...defaultBlockProps },
    content: [],
    children: [],
  }]
}

export function loadTiptapContent(): JSONContent {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    const blocks = saved ? JSON.parse(saved) as Block[] : createDefaultBlocks()
    return { type: 'doc', content: blocks.map(blockToTiptap) }
  } catch {
    return { type: 'doc', content: createDefaultBlocks().map(blockToTiptap) }
  }
}

export function saveTiptapContent(content: JSONContent) {
  try {
    const blocks = (content.content ?? []).map(tiptapBlockToBlockNote)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks))
  } catch {
    // Editing still works when localStorage is unavailable or full.
  }
}
