# HTML для блоков элементов списка

## Назначение

Документ определяет импорт и экспорт `bulletListItem`, `numberedListItem` и
`checkListItem` в полном BlockNote HTML и interoperable HTML.

Общие режимы HTML, безопасность, diagnostics и round trip описаны в
[общей спецификации HTML](../../html.md). Модель блоков определена в
[list-types.md](./list-types.md), а inline-разметка — в
[inline-content.md](../../inline-content.md).

## Редакторское отображение

- Соседние list-item blocks визуально группируются в `<ul>` или `<ol>`.
- `<ul>` и `<ol>` не создают отдельный публичный `Block`.
- Inline content элемента находится в `<li>` или его текстовой обёртке.
- Вложенные элементы располагаются в списке внутри родительского `<li>`.
- Маркер, номер и checkbox не входят в inline content.

## Импорт HTML

### Interoperable HTML

- `<ul><li>` создаёт `bulletListItem`, `<ol><li>` — `numberedListItem`.
- `<ol start="N">` задаёт `start: N` первому элементу; следующие элементы
  продолжают нумерацию.
- Поддерживаемый явный номер `<li>` восстанавливается как `start` элемента.
- Вложенный `<ul>` или `<ol>` импортируется в `children`.
- Task-list разметка создаёт `checkListItem` только при однозначном признаке;
  checkbox преобразуется в `checked` и не входит в текст.
- Inline elements внутри `<li>` преобразуются в `InlineContent[]`.
- Malformed nesting, неизвестные attrs и отсутствующие типы используют безопасный
  fallback с warning.
- Импортированные элементы получают новые UUID v7.

### Полный BlockNote HTML

- Служебные wrappers и `data-*` attrs сохраняют точные `type`, `id`,
  `DefaultProps`, `start`, `checked`, inline content и `children`.
- `blockContainer` сохраняет границу элемента, дочерний `blockGroup` — его
  `children`.
- Валидные служебные данные имеют приоритет над семантическими эвристиками, но
  props обязательно проходят проверку схемы.
- `data-id` восстанавливается только в доверенном режиме и нормализуется согласно
  [block-id.md](../../block-id.md).

## Экспорт в полный BlockNote HTML

- Каждый элемент сохраняется в стандартной блочной обёртке с точным
  `data-content-type`.
- Сохраняются `id`, `DefaultProps`, `start`, `checked`, inline content и children.
- Вложенность записывается отдельными `blockGroup`, а не текстом или маркерами.
- В доверенном режиме round trip восстанавливает эквивалентные публичные blocks.

## Экспорт в interoperable HTML

| Тип блока | Семантический HTML |
| --- | --- |
| `bulletListItem` | `<li>` внутри `<ul>` |
| `numberedListItem` | `<li>` внутри `<ol>` |
| `checkListItem` | task-list `<li>` внутри `<ul>` с checked-state |

```html
<ul>
  <li>
    Первый пункт
    <ol start="3">
      <li>Вложенный третий пункт</li>
    </ol>
  </li>
  <li>Второй пункт</li>
</ul>
```

- Соседние совместимые элементы группируются в один список.
- Текстовая обёртка внутри `<li>` при импорте не создаёт лишний Paragraph.
- Вложенный список находится внутри родительского `<li>`.
- `start`, отличный от `1`, экспортируется как `<ol start="N">`.
- Явный разрыв нумерации начинает новую `<ol>` либо использует другое валидное
  представление, сохраняющее номер.
- Checklist сохраняет `checked` машиночитаемо; checkbox не становится текстом.
- Отличающиеся от defaults block props экспортируются переносимыми CSS styles,
  когда это допускает профиль HTML.

## Безопасность

- `<script>`, event-handler attrs и опасные URL не выполняются и не импортируются
  как активный код.
- CSS обрабатывается по allowlist поддерживаемых свойств и значений.
- Интерактивные checkbox при импорте рассматриваются как данные, а не как
  доверенные обработчики поведения.
- Импорт использует HTML parser, а экспорт экранирует пользовательские данные.

## Round trip

Полный доверенный HTML сохраняет типы, ID, props, inline content и children.
Interoperable HTML сохраняет порядок, поддерживаемые типы, текст, вложенность,
нумерацию и checklist state. UUID и часть block props могут быть потеряны.

## Критерии приёмки

1. `<ul>` и `<ol>` создают последовательность list-item blocks без контейнера.
2. Вложенные списки восстанавливаются в `children`.
3. `<ol start>` корректно восстанавливает `start`.
4. Task-list checked-state сохраняется вне inline content.
5. Full HTML round trip сохраняет типы, ID, props, content и children.
6. Interoperable export создаёт семантические `<ul>`, `<ol>` и `<li>`.
7. Default props не создают лишних inline styles.
8. Malformed и небезопасный HTML не приводит к исполнению кода или падению.

## Открытые вопросы для проверки по эталону

- точные служебные wrappers и attrs для каждого типа;
- HTML-профиль task lists и способ хранения `checked`;
- разрывы нумерации внутри одной группы;
- смешанные типы вложенных blocks внутри `<li>`;
- нормализация пустых элементов списка.
