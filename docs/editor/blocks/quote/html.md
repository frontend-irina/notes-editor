# HTML для блока Quote

## Назначение

Документ определяет импорт и экспорт блока `quote` в полном BlockNote HTML и
interoperable HTML.

Общие режимы HTML, безопасность, diagnostics и round trip описаны в
[общей спецификации HTML](../../html.md). Модель блока определена в
[quote.md](./quote.md), а inline-разметка — в
[inline-content.md](../../inline-content.md).

## Редакторское отображение

- Quote отображается семантическим элементом `<blockquote>`.
- `InlineContent[]` располагается внутри `<blockquote>`.
- Дочерние blocks находятся в отдельном `blockGroup` и не входят в inline content.
- Служебные элементы редактора, caret, selection и toolbar не экспортируются.

## Импорт HTML

### Interoperable HTML

- `<blockquote>` создаёт `QuoteBlock`, если тип присутствует в активной схеме.
- Атрибут `cite` не входит в публичную модель и игнорируется либо отражается в
  warning расширенного API.
- Поддерживаемые inline elements преобразуются в `InlineContent[]`; сам
  `<blockquote>` не создаёт лишний Paragraph.
- Пустой `<blockquote></blockquote>` создаёт Quote с `content: []`.
- Импортированный Quote получает новый UUID v7.
- `backgroundColor` и `textColor` могут восстанавливаться из разрешённых
  `background-color` и `color` самого `<blockquote>`.
- `textAlignment` не создаётся, поскольку его нет в prop schema Quote.
- Несколько block-level элементов или вложенный `<blockquote>` восстанавливаются
  через Quote и `children` только при однозначном mapping; иначе структура
  детерминированно упрощается с warning.

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

Block styles `<blockquote>` преобразуются в props, а styles его inline-потомков —
в стили `StyledText`. Значения проходят prop schema Quote; недопустимые значения
заменяются defaults либо отбрасываются с warning.

### Полный BlockNote HTML

- Quote сохраняется внутри стандартных `blockOuter` / `blockContainer` wrappers.
- Block content имеет `data-content-type="quote"`.
- Служебные `data-*` attrs сохраняют `backgroundColor` и `textColor` и имеют
  приоритет согласно общей политике импорта.
- `data-id` восстанавливается только в доверенном режиме и нормализуется по
  [block-id.md](../../block-id.md).
- Отдельный `blockGroup` восстанавливается в `children`.

## Экспорт в полный BlockNote HTML

```html
<div class="bn-block-outer" data-node-type="blockOuter" data-id="…">
  <div class="bn-block" data-node-type="blockContainer" data-id="…">
    <div
      class="bn-block-content"
      data-content-type="quote"
      data-background-color="default"
      data-text-color="default"
    >
      <blockquote class="bn-inline-content">Текст цитаты</blockquote>
    </div>
    <!-- отдельный blockGroup с children при наличии -->
  </div>
</div>
```

- Сохраняются `id`, type, props, inline content и `children`.
- В доверенном режиме повторный импорт восстанавливает эквивалентный Quote.
- Дочерние blocks не помещаются внутрь `<blockquote>`.

## Экспорт в interoperable HTML

Quote экспортируется без обязательных BlockNote wrappers:

```html
<blockquote style="color: #b91c1c">
  Текст с <strong>жирным</strong> начертанием и
  <a href="https://example.com">ссылкой</a>.
</blockquote>
```

- Поддерживаемое inline content сериализуется непосредственно внутри элемента.
- Отличающиеся от `"default"` цвета экспортируются как `background-color` и
  `color`; default-значения не создают styles.
- Именованные цвета темы преобразуются в переносимые CSS-значения.
- `id` и служебные attrs BlockNote не экспортируются.
- Пользовательский текст и значения attrs корректно экранируются.

## Дочерние блоки

- В полном HTML отдельный `blockGroup` сохраняет исходную вложенность.
- В interoperable HTML дети могут выводиться после `<blockquote>` как соседние
  blocks.
- Потеря исходной вложенности сопровождается warning.

## Безопасность

- `<script>`, event-handler attrs и опасные URL не выполняются и не импортируются
  как активный код.
- CSS обрабатывается по allowlist поддерживаемых свойств и значений.
- Неизвестные inline elements сохраняют читаемый текст, когда это безопасно.
- Импорт использует HTML parser, а не регулярные выражения.
- Экспорт экранирует пользовательский текст и значения атрибутов.

## Round trip

Полный доверенный HTML сохраняет `id`, type, props, inline content и children.
Interoperable HTML сохраняет тип, видимый текст, поддерживаемые inline styles и
переносимые block colors; ID создаётся заново, а children могут потерять
вложенность.

## Критерии приёмки

1. `<blockquote>` импортируется как `QuoteBlock`.
2. Пустой `<blockquote>` создаёт Quote с `content: []`.
3. Inline elements преобразуются согласно модели `InlineContent`.
4. Block-level и inline colors не смешиваются.
5. `textAlignment` не появляется в props Quote.
6. Full HTML round trip сохраняет `id`, props, content и children.
7. Interoperable export создаёт семантический `<blockquote>`.
8. Default props не создают лишних inline styles.
9. Lossy flattening children диагностируется.
10. Небезопасная разметка не исполняется и не импортируется как активный код.

## Открытые вопросы для проверки по эталону

- точная форма wrappers и служебных attrs полного BlockNote HTML;
- нормализация пустого `<blockquote>` и `<blockquote><br></blockquote>`;
- mapping нескольких block-level потомков и вложенных `<blockquote>`;
- приоритет служебных attrs и inline style при конфликте;
- допустимый набор CSS colors;
- обработка атрибута `cite`.
