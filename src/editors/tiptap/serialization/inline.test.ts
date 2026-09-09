import { expect, test } from 'vitest'
import { inlineToTiptap, tiptapInlineToBlockNote } from './inline'

test('serializes all styles and link segments without empty text', () => {
  expect(inlineToTiptap([
    { type: 'text', text: '', styles: {} },
    { type: 'text', text: 'plain', styles: { bold: false, textColor: 'default' } },
    { type: 'link', href: 'https://example.com', content: [{
      type: 'text', text: 'styled', styles: {
        bold: true, italic: true, underline: true, strike: true, code: true,
        textColor: 'red', backgroundColor: 'yellow',
      },
    }] },
  ])).toEqual([
    { type: 'text', text: 'plain' },
    { type: 'text', text: 'styled', marks: [
      { type: 'bold' }, { type: 'italic' }, { type: 'underline' },
      { type: 'strike' }, { type: 'code' },
      { type: 'textColor', attrs: { color: 'red' } },
      { type: 'backgroundColor', attrs: { color: 'yellow' } },
      { type: 'link', attrs: { href: 'https://example.com' } },
    ] },
  ])
})

test('restores every style independently from explicit marks', () => {
  expect(tiptapInlineToBlockNote([{ type: 'text', text: 'x', marks: [
    { type: 'bold' }, { type: 'italic' }, { type: 'underline' },
    { type: 'strike' }, { type: 'code' },
    { type: 'textColor', attrs: { color: 'blue' } },
    { type: 'backgroundColor', attrs: { color: 'yellow' } },
  ] }])).toEqual([{ type: 'text', text: 'x', styles: {
    bold: true, italic: true, underline: true, strike: true, code: true,
    textColor: 'blue', backgroundColor: 'yellow',
  } }])
})

test('coalesces compatible text, preserving whitespace and style boundaries', () => {
  expect(tiptapInlineToBlockNote([
    { type: 'text', text: 'hello' }, { type: 'text', text: ' ' },
    { type: 'text', text: 'world', marks: [{ type: 'bold' }] },
    { type: 'text', text: '' }, { type: 'unknown' },
  ])).toEqual([
    { type: 'text', text: 'hello ', styles: {} },
    { type: 'text', text: 'world', styles: { bold: true } },
  ])
  expect(tiptapInlineToBlockNote()).toEqual([])
})

test('groups adjacent link segments by href without losing their styles', () => {
  expect(tiptapInlineToBlockNote([
    { type: 'text', text: 'a', marks: [{ type: 'link', attrs: { href: '/one' } }] },
    { type: 'text', text: 'b', marks: [{ type: 'bold' }, { type: 'link', attrs: { href: '/one' } }] },
    { type: 'text', text: 'c', marks: [{ type: 'link', attrs: { href: '/two' } }] },
  ])).toEqual([
    { type: 'link', href: '/one', content: [
      { type: 'text', text: 'a', styles: {} },
      { type: 'text', text: 'b', styles: { bold: true } },
    ] },
    { type: 'link', href: '/two', content: [{ type: 'text', text: 'c', styles: {} }] },
  ])
})

test('normalizes the same style set regardless of mark order', () => {
  // docs/editor/inline-content.md: adjacent equal style sets become one fragment.
  expect(tiptapInlineToBlockNote([
    { type: 'text', text: 'a', marks: [{ type: 'bold' }, { type: 'italic' }] },
    { type: 'text', text: 'b', marks: [{ type: 'italic' }, { type: 'bold' }] },
  ])).toEqual([{ type: 'text', text: 'ab', styles: { bold: true, italic: true } }])
})
