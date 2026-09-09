import type { BlockMenuItem } from './types'

function headingItem(level: 1 | 2 | 3 | 4 | 5 | 6): BlockMenuItem {
  return {
    type: `heading-${level}` as const,
    title: `Заголовок ${level}`,
    subtext: level === 1 ? 'Заголовок верхнего уровня' : `Заголовок ${level} уровня`,
    aliases: [`h${level}`, `heading${level}`, `заголовок${level}`, 'заголовок'],
    group: 'Заголовки',
    badge: `Mod+Alt+${level}`,
  }
}

export const BLOCK_MENU_ITEMS: BlockMenuItem[] = [
  {
    type: 'paragraph',
    title: 'Параграф',
    subtext: 'Основной текст',
    aliases: ['p', 'paragraph', 'параграф'],
    group: 'Текст',
    badge: 'Mod+Alt+0',
  },
  headingItem(1),
  headingItem(2),
  headingItem(3),
  headingItem(4),
  headingItem(5),
  headingItem(6),
  {
    type: 'quote',
    title: 'Цитата',
    subtext: 'Цитата или отрывок',
    aliases: ['quotation', 'blockquote', 'bq', 'цитата'],
    group: 'Цитаты',
  },
  {
    type: 'numberedListItem',
    title: 'Нумерованный список',
    subtext: 'Список с нумерацией',
    aliases: ['ol', 'li', 'list', 'numbered list', 'список'],
    group: 'Списки',
    badge: 'Mod+Shift+7',
  },
  {
    type: 'bulletListItem',
    title: 'Маркированный список',
    subtext: 'Список с маркерами',
    aliases: ['ul', 'li', 'list', 'bullet list', 'список'],
    group: 'Списки',
    badge: 'Mod+Shift+8',
  },
  {
    type: 'checkListItem',
    title: 'Контрольный список',
    subtext: 'Список с флажками',
    aliases: ['checklist', 'check list', 'checkbox', 'список'],
    group: 'Списки',
    badge: 'Mod+Shift+9',
  },
]

export function filterBlockMenuItems(query: string) {
  const normalizedQuery = query.toLocaleLowerCase()
  return BLOCK_MENU_ITEMS.filter(({ title, aliases }) => (
    title.toLocaleLowerCase().includes(normalizedQuery)
    || aliases.some((alias) => alias.toLocaleLowerCase().includes(normalizedQuery))
  ))
}
