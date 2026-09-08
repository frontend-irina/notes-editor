# HTML для блока Paragraph

## Назначение

Документ определяет импорт и экспорт блока `paragraph` в полном BlockNote HTML и
interoperable HTML.

Общие режимы HTML, безопасность, diagnostics и round trip описаны в
[общей спецификации HTML](../../html.md). Модель блока определена в
[paragraph.md](./paragraph.md), а inline-разметка — в
[inline-content.md](../../inline-content.md).

## Редакторское отображение

- Редактируемое содержимое Paragraph отображается семантическим элементом `<p>`.
- `InlineContent[]` отображается внутри `<p>`.
- Дочерние blocks не становятся содержимым `<p>` и располагаются в отдельной
  области `blockGroup` блочной обёртки.
- Служебные элементы редактора, caret, selection и toolbar не являются частью
  экспортируемого содержимого Paragraph.

## Импорт HTML

### Interoperable HTML

- Элемент `<p>` импортируется как `ParagraphBlock`.
- Текстовые узлы и поддерживаемые inline elements внутри `<p>` преобразуются в
  `InlineContent[]`.
- Пустой `<p></p>` и `<p><br></p>` нормализуются в Paragraph с `content: []`.
- Внешний Paragraph получает новый UUID v7.
- При отсутствии переносимых styles используются default props.
- Block-level elements, вложенные в невалидный `<p>`, обрабатываются HTML parser и
  общим импортёром как отдельные blocks; они не должны попадать в inline content.

Поддерживаемые inline mappings:

| HTML | `InlineContent` |
| --- | --- |
| `<strong>`, `<b>` | `bold: true` |
| `<em>`, `<i>` | `italic: true` |
| `<u>` | `underline: true` |
| `<s>`, `<del>`, `<strike>` | `strike: true` |
| `<code>` | `code: true` |
| `<a href>` | `Link` |
| `<br>` | поддерживаемый перенос строки |
| inline `color` | inline `textColor` |
| inline `background-color` | inline `backgroundColor` |

### Props

Для interoperable HTML Paragraph может восстановить:

- `backgroundColor` из разрешённого `background-color` самого `<p>`;
- `textColor` из разрешённого `color` самого `<p>`;
- `textAlignment` из разрешённого `text-align` самого `<p>`.

Правила:

- block styles элемента `<p>` преобразуются в `props`, а styles его inline-потомков
  — в styles соответствующих `StyledText`;
- значения проходят валидацию `DefaultProps`;
- отсутствующие или недопустимые значения заменяются defaults либо отбрасываются
  с warning;
- полный CSS cascade и внешние stylesheets не являются частью контракта parser.

### Полный BlockNote HTML

- `data-content-type="paragraph"` однозначно определяет тип блока.
- `data-id` восстанавливается только в явно выбранном доверенном режиме импорта;
  отсутствующие и повторяющиеся ID нормализуются согласно
  [block-id.md](../../block-id.md).
- `data-background-color`, `data-text-color` и `data-text-alignment` имеют
  приоритет как служебное представление props.
- `blockGroup` после содержимого Paragraph восстанавливается в `children`, не
  смешиваясь с `InlineContent[]`.

## Экспорт в полный BlockNote HTML

Полный HTML сохраняет структуру и данные блока:

```html
<div class="bn-block-outer" data-node-type="blockOuter" data-id="…">
  <div class="bn-block" data-node-type="blockContainer" data-id="…">
    <div
      class="bn-block-content"
      data-content-type="paragraph"
      data-background-color="default"
      data-text-color="default"
      data-text-alignment="left"
    >
      <p class="bn-inline-content">Текст параграфа</p>
    </div>
    <!-- отдельный blockGroup с children при наличии -->
  </div>
</div>
```

- Сохраняются `id`, type, props, inline content и `children`.
- Конкретный набор default `data-*` attrs может нормализоваться exporter, но
  повторный доверенный импорт обязан восстановить эквивалентный Paragraph.
- Вложенные blocks экспортируются в отдельном `blockGroup`.
- Для визуального совпадения статического HTML потребитель подключает совместимые
  стили BlockNote.

## Экспорт в interoperable HTML

Paragraph экспортируется как семантический `<p>`:

```html
<p style="color: #1d4ed8; text-align: center">
  Обычный <strong>текст</strong> и
  <a href="https://example.com">ссылка</a>.
</p>
```

- Inline content сериализуется стандартными HTML elements и минимальными inline
  styles.
- `backgroundColor`, `textColor` и `textAlignment`, отличающиеся от defaults,
  экспортируются переносимыми CSS declarations.
- `"default"` и `textAlignment: "left"` не создают лишних declarations.
- Именованные цвета темы перед экспортом преобразуются в переносимые CSS-значения.
- `id` и служебные attrs BlockNote не обязательны и не экспортируются.
- Пользовательский текст и значения attrs корректно экранируются.

## Дочерние блоки

- `children` не помещаются внутрь `<p>`, поскольку block-level content внутри
  paragraph невалиден.
- В полном HTML отдельный `blockGroup` сохраняет исходную вложенность.
- В interoperable HTML дети Paragraph выводятся после `<p>` как соседние blocks.
- Потеря исходной вложенности при interoperable export должна сопровождаться
  warning.

## Безопасность

- `<script>`, event-handler attrs и опасные URL не выполняются и не импортируются
  как активный код.
- CSS Paragraph обрабатывается по allowlist поддерживаемых свойств и значений.
- Неизвестные inline elements сохраняют читаемый текст, когда это безопасно.
- Импорт не должен использовать регулярные выражения вместо HTML parser.
- Экспорт обязан экранировать `<`, `>`, `&`, кавычки в attrs и другие значимые
  символы по правилам HTML.

## Round trip

### Полный HTML

```text
ParagraphBlock → Full HTML → ParagraphBlock
```

В доверенном режиме сохраняются `id`, type, props, inline content и children.

### Interoperable HTML

```text
ParagraphBlock → Interoperable HTML → ParagraphBlock
```

Сохраняются тип, видимый текст, поддерживаемые inline styles и переносимые block
props. ID создаётся заново, а children могут потерять вложенность.

## Критерии приёмки

1. `<p>` импортируется как `ParagraphBlock`.
2. Пустой `<p>` создаёт Paragraph с `content: []`.
3. Inline elements преобразуются согласно модели `InlineContent`.
4. Block-level и inline colors не смешиваются.
5. Поддерживаемые block styles восстанавливаются в `DefaultProps`.
6. Full HTML round trip сохраняет `id`, props, content и children в доверенном
   режиме.
7. Interoperable export создаёт семантический `<p>` без обязательных служебных
   wrappers.
8. Default props не создают лишних inline styles.
9. Children не помещаются внутрь `<p>`; lossy flattening диагностируется.
10. Небезопасная разметка не исполняется и не попадает в документ как активный
    код.
11. Экспорт корректно экранирует пользовательские данные.

## Открытые вопросы для проверки по эталону

- точное поведение `<div>` и голых текстовых узлов как fallback Paragraph;
- нормализация `<p><br></p>` и нескольких последовательных пустых Paragraph;
- приоритет служебных `data-*` attrs и inline style при конфликте;
- сохранение whitespace вокруг вложенных inline elements;
- допустимый набор CSS colors и значений `text-align`;
- импорт malformed HTML с block-level elements внутри `<p>`.
