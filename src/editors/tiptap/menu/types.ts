export type MenuBlockType =
  | 'paragraph'
  | 'quote'
  | 'bulletListItem'
  | 'numberedListItem'
  | 'checkListItem'
  | `heading-${1 | 2 | 3 | 4 | 5 | 6}`

export type BlockMenuItem = {
  type: MenuBlockType
  title: string
  subtext: string
  aliases: string[]
  group: string
  badge?: string
}

export type BlockMenuState = {
  open: boolean
  triggerFrom: number
  queryFrom: number
  query: string
  selectedIndex: number
  deleteTrigger: boolean
}
