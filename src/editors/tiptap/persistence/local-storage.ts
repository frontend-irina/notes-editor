import type { Block } from '../types'
import { flattenBlocks, normalizeBlockDepth } from './blocks'

export class BlockStorageError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'BlockStorageError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isBlock(value: unknown): value is Block {
  if (!isRecord(value)) return false
  if (typeof value.id !== 'string' || value.id.length === 0) return false
  if (!['paragraph', 'heading', 'quote', 'bulletListItem', 'numberedListItem', 'checkListItem']
    .includes(String(value.type))) return false
  if (!isRecord(value.props) || !Array.isArray(value.content) || !Array.isArray(value.children)) return false
  return value.children.every(isBlock)
}

export function serializeBlockTree(blocks: Block[]) {
  const normalized = normalizeBlockDepth(blocks)
  flattenBlocks(normalized)
  return JSON.stringify(normalized)
}

export function parseBlockTree(serialized: string): Block[] {
  let value: unknown
  try {
    value = JSON.parse(serialized)
  } catch (error) {
    throw new BlockStorageError('Stored block document is not valid JSON', { cause: error })
  }
  if (!Array.isArray(value) || value.length === 0 || !value.every(isBlock)) {
    throw new BlockStorageError('Stored block document is not a valid Block array')
  }
  flattenBlocks(value)
  return value
}

export function readBlockTree(storage: Storage, key: string) {
  const serialized = storage.getItem(key)
  return serialized === null ? null : parseBlockTree(serialized)
}

export function writeBlockTree(storage: Storage, key: string, blocks: Block[]) {
  storage.setItem(key, serializeBlockTree(blocks))
}
