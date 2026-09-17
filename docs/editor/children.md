# Children, вложенность и persistence

## Назначение

Публичная модель следует BlockNote: документ представлен массивом top-level
блоков, а каждый блок содержит массив непосредственных `children`. Этот документ
определяет общий предел вложенности и преобразование между деревом редактора,
`localStorage` и плоским backend-контрактом.

## Модель глубины

```ts
export const MAX_BLOCK_DEPTH = 5
```

- top-level блок имеет глубину 1;
- каждый переход в `children` увеличивает глубину на 1;
- leaf-блок содержит `children: []`;
- ни одна операция редактора не создаёт блок глубже 5.

`Tab` выполняет nest только при наличии предыдущего sibling и когда вся
перемещаемая ветка помещается в лимит. `Shift+Tab` уменьшает вложенность. Попытка
nest за предел лимита не меняет документ и не создаёт шаг истории.

Drag-and-drop также проверяет самый глубокий descendant переносимой ветки. Если
целевая позиция привела бы к шестому уровню, drop целиком отклоняется.

## Нормализация вставки

Структурный paste или импорт нормализуется до изменения документа. Все блоки,
которые оказались бы на уровне 6 или глубже, поднимаются на уровень 5 и становятся
siblings в порядке depth-first обхода.

```text
До:    D4 -> E5 -> F6 -> G7, затем H5
После: D4 -> [E5, F5, G5, H5]
```

Сохраняются ID, type, props и content каждого блока. Теряются только parent-child
связи, которые нарушают лимит. Обычная вставка inline-текста структуру не меняет.

## Nested-модель редактора и localStorage

Редактор и `localStorage` используют публичное дерево:

```ts
type Block = {
  id: string
  type: string
  props: Record<string, unknown>
  content: InlineContent[]
  children: Block[]
}
```

Перед записью дерево нормализуется и валидируется. В `localStorage` сохраняется
JSON массива `Block[]`, а не Tiptap JSON и не плоский backend-массив. При чтении
невалидный JSON, неизвестная форма, дубликаты ID и превышение глубины возвращают
ошибку; повреждённый snapshot не применяется частично.

## Плоский backend-контракт

```ts
type FlatBlock = Omit<Block, 'children'> & {
  parentId: string | null
  position: {
    before: string | null // предыдущий sibling
    after: string | null  // следующий sibling
  }
}
```

`parentId: null` обозначает top-level. Ссылки `before` и `after` всегда относятся
к siblings с тем же `parentId`.

Для порядка `A, B, C`:

```text
A: { before: null, after: B }
B: { before: A,    after: C }
C: { before: B,    after: null }
```

Единственный sibling имеет `{ before: null, after: null }`.

## Преобразования

- `flattenBlocks(Block[])` строит `FlatBlock[]` depth-first.
- `buildBlockTree(FlatBlock[])` собирает дерево независимо от порядка элементов
  входного массива.
- `normalizeBlockDepth(Block[])` поднимает уровни 6+ на уровень 5.
- `toBackendBlocks` и `fromBackendBlocks` обозначают backend-границу.
- `serializeBlockTree`/`parseBlockTree` и `readBlockTree`/`writeBlockTree`
  обозначают границу `localStorage`.

При сборке flat-модели проверяются уникальность ID, наличие parent, отсутствие
parent-циклов, взаимность sibling-ссылок и единственный порядок каждой группы.
Ошибка возвращается целиком и содержит код и ID проблемных блоков.

## Сравнение состояний

`diffFlatBlocks` сравнивает текущее состояние с последним подтверждённым снимком:

- `created` — новые ID;
- `updated` — изменившиеся type, props или content;
- `moved` — изменившиеся `parentId`, `before` или `after`;
- `deleted` — отсутствующие ID.

Перемещение родителя не помечает descendants как moved, если их непосредственный
`parentId` и sibling-позиция не изменились.

## Критерии приёмки

1. Все структурные пути соблюдают `MAX_BLOCK_DEPTH`.
2. Nest и drop не создают шестой уровень даже для ветки с descendants.
3. Структурный paste уровня 6+ сохраняет все блоки на уровне 5 в depth-first порядке.
4. Inline paste не меняет children.
5. `tree -> flat -> tree` сохраняет данные и порядок документа глубиной 1–5.
6. Flat-to-tree не зависит от порядка входного массива.
7. Повреждённые parent/sibling-ссылки и циклы диагностируются без частичного дерева.
8. `localStorage` round trip сохраняет nested `Block[]`.
9. Перемещение ветки не создаёт move для неизменившихся descendants.
