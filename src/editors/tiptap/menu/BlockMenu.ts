import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import { blockMenuKey, menuState } from './menu-state'
import { menuInput } from './menu-input'
import { menuDecorations } from './menu-decorations'
import { menuAccessibility } from './menu-accessibility'
import type { BlockMenuState } from './types'

export const BlockMenu = Extension.create({
  name: 'blockMenu',

  addProseMirrorPlugins() {
    return [new Plugin<BlockMenuState>({
      key: blockMenuKey,
      state: menuState,
      props: { ...menuInput, decorations: menuDecorations },
      view: menuAccessibility,
    })]
  },
})
