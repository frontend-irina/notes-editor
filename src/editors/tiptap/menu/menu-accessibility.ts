import type { EditorView } from '@tiptap/pm/view'
import type { PluginView } from '@tiptap/pm/state'
import { blockMenuKey } from './menu-state'

export function menuAccessibility(view: EditorView): PluginView {
  return {
    update(currentView) {
      const state = blockMenuKey.getState(currentView.state)
      if (state?.open) {
        currentView.dom.setAttribute('aria-expanded', 'true')
        currentView.dom.setAttribute('aria-controls', 'tiptap-block-menu')
        currentView.dom.setAttribute('aria-activedescendant', `tiptap-block-menu-item-${state.selectedIndex}`)
      } else {
        currentView.dom.removeAttribute('aria-expanded')
        currentView.dom.removeAttribute('aria-controls')
        currentView.dom.removeAttribute('aria-activedescendant')
      }
    },
    destroy() {
      view.dom.removeAttribute('aria-expanded')
      view.dom.removeAttribute('aria-controls')
      view.dom.removeAttribute('aria-activedescendant')
    },
  }
}
