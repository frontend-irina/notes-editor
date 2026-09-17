## Why

Редактор уже использует BlockNote-подобную публичную модель с рекурсивным
`children: Block[]`, но единые правила глубины, преобразования дерева в backend-
формат и локального хранения пока не определены. Без общего контракта paste,
drag-and-drop, nest/unnest и восстановление документа могут по-разному трактовать
родителей и порядок блоков.

BlockNote служит референсом для публичного дерева: документ содержит top-level
блоки, каждый блок может содержать `children`, а обход выполняется depth-first.
Наше отличие — глобальное ограничение глубины и плоский backend-контракт.

Референсы:

- [BlockNote Document Structure](https://www.blocknotejs.org/docs/foundations/document-structure)
- [BlockNote Manipulating Content](https://www.blocknotejs.org/docs/reference/editor/manipulating-content)
- [Drag-and-drop](../../../docs/editor/drag-and-drop.md)
- [Block ID](../../../docs/editor/block-id.md)

## What Changes

- Ввести единую экспортируемую константу `MAX_BLOCK_DEPTH = 5`; top-level
  считается уровнем 1.
- Запретить интерактивным операциям создавать блоки глубже пятого уровня.
- Нормализовать структурную вставку: блоки исходного уровня 6 и глубже становятся
  sibling-блоками уровня 5 с сохранением depth-first порядка и данных.
- Определить взаимно обратные преобразования nested `Block[]` и плоского
  `FlatBlock[]` с `parentId` и соседними ссылками `position.before/after`.
- Использовать nested `Block[]` как формат `localStorage`, а плоский массив — как
  контракт backend и основу сравнения/операций сохранения.
- Определить валидацию отсутствующих родителей, циклов, дубликатов ID и
  некорректных sibling-ссылок без тихой потери блоков.
- Добавить отдельную документацию children/persistence и связать её с
  существующими требованиями drag-and-drop, списков и архитектуры.

## Capabilities

### New Capabilities

- `block-children-persistence`: глубина дерева, нормализация вложенности,
  tree/flat-преобразования и форматы backend/localStorage.

### Modified Capabilities

- Drag-and-drop и nest/unnest получают общий предел глубины.
- Импорт и paste получают обязательную нормализацию глубины перед изменением
  документа.

## Impact

Изменение затронет публичные типы и константы, сериализацию блоков, структурные
команды, paste/import, drag-and-drop, слой persistence и документацию. Backend в
рамках изменения не реализуется: фронтенд только формирует и принимает его
плоский контракт. Формат `localStorage` остаётся читаемым BlockNote-подобным
JSON-деревом.
