import { expect, test } from 'vitest'
import { defaultBlockProps, defaultHeadingProps, defaultQuoteProps } from './types'

test('public defaults distinguish aligned blocks, headings and quotes', () => {
  expect(defaultBlockProps).toEqual({ backgroundColor: 'default', textColor: 'default', textAlignment: 'left' })
  expect(defaultHeadingProps).toEqual({ ...defaultBlockProps, level: 1 })
  expect(defaultQuoteProps).toEqual({ backgroundColor: 'default', textColor: 'default' })
  expect(defaultHeadingProps).not.toBe(defaultBlockProps)
})
