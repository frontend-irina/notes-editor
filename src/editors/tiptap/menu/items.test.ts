import { expect, test } from 'vitest'
import { BLOCK_MENU_ITEMS, filterBlockMenuItems } from './items'

test('catalog has unique entries and searches titles and aliases case insensitively', () => {
  expect(new Set(BLOCK_MENU_ITEMS.map(item => item.type)).size).toBe(11)
  expect(filterBlockMenuItems('')).toEqual(BLOCK_MENU_ITEMS)
  expect(filterBlockMenuItems('H3').map(item => item.type)).toEqual(['heading-3'])
  expect(filterBlockMenuItems('ЦИТАТА').map(item => item.type)).toEqual(['quote'])
  expect(filterBlockMenuItems('impossible')).toEqual([])
  expect(filterBlockMenuItems('список')).toHaveLength(3)
})

