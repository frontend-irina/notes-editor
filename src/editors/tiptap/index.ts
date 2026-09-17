export { TiptapEditor } from './TiptapEditor'
export type { TiptapEditorProps } from './TiptapEditor'
export {
  BlockTreeError,
  buildBlockTree,
  flattenBlocks,
  normalizeBlockDepth,
  diffFlatBlocks,
  fromBackendBlocks,
  toBackendBlocks,
  BlockStorageError,
  parseBlockTree,
  readBlockTree,
  serializeBlockTree,
  writeBlockTree,
} from './persistence'
export type { BlockTreeErrorCode, FlatBlockDiff } from './persistence'
export type {
  Block,
  BlockPosition,
  BulletListItemBlock,
  CheckListItemBlock,
  HeadingBlock,
  HeadingLevel,
  FlatBlock,
  InlineContent,
  Link,
  NumberedListItemBlock,
  ParagraphBlock,
  QuoteBlock,
  StyledText,
  TextAlignment,
  TextStyles,
} from './types'
export { MAX_BLOCK_DEPTH } from './types'
