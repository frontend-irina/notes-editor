# HTML для блока Heading

## Назначение

Документ определяет импорт и экспорт блока `heading` в полном BlockNote HTML и
interoperable HTML.

Общие режимы HTML, безопасность, diagnostics и round trip описаны в
[общей спецификации HTML](../../html.md). Модель блока определена в
[heading.md](./heading.md), а inline-разметка — в
[inline-content.md](../../inline-content.md).

## Редакторское отображение

- Heading уровня 1–6 отображается семантическим элементом `<h1>`–`<h6>`.
- `InlineContent[]` находится внутри соответствующего `<hN>`.
- Дочерние blocks располагаются в отдельном `blockGroup`, а не внутри `<hN>`.
- Служебные элементы редактора, caret, selection и toolbar не экспортируются.

## Импорт HTML

### Interoperable HTML

- `<h1>`–`<h6>` импортируются как `HeadingBlock` с соответствующим `props.level`.
- Текстовые узлы и поддерживаемые inline elements преобразуются в
  `InlineContent[]`.
- Пустой `<hN></hN>` нормализуется в Heading с `content: []`.
- Внешний Heading получает новый UUID v7.
- При отсутствии переносимых styles используются default props.
- Block-level elements внутри malformed `<hN>` не попадают в inline content.
- `<details>` и `<summary>` не являются Heading и без отдельного правила не
  импортируются как `HeadingBlock`.

Поддерживаемые inline mappings совпадают с Paragraph:

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

Для interoperable HTML восстанавливаются:

- `level` из имени элемента `<h1>`–`<h6>`;
- `backgroundColor` из разрешённого `background-color` самого `<hN>`;
- `textColor` из разрешённого `color` самого `<hN>`;
- `textAlignment` из разрешённого `text-align` самого `<hN>`.

Block styles элемента heading преобразуются в props, а styles inline-потомков —
в стили соответствующих `StyledText`. Недопустимые значения заменяются defaults
либо отбрасываются с warning. Внешние stylesheets и полный CSS cascade не входят
в контракт parser.

### Полный BlockNote HTML

- `data-content-type="heading"` однозначно определяет тип блока.
- `data-level` восстанавливает семантический уровень после валидации.
- `data-id` восстанавливается только в доверенном режиме; отсутствующие и
  повторяющиеся ID нормализуются согласно [block-id.md](../../block-id.md).
- Служебные attrs стандартных props имеют приоритет над совместимыми inline CSS-
  значениями согласно общей политике импорта.
- `blockGroup` после содержимого Heading восстанавливается в `children`.

## Экспорт в полный BlockNote HTML

Полный HTML сохраняет структуру и данные блока:

```html
<div class="bn-block-outer" data-node-type="blockOuter" data-id="…">
  <div class="bn-block" data-node-type="blockContainer" data-id="…">
    <div
      class="bn-block-content"
      data-content-type="heading"
      data-level="2"
      data-background-color="default"
      data-text-color="default"
      data-text-alignment="left"
    >
      <h2 class="bn-inline-content">Заголовок раздела</h2>
    </div>
    <!-- отдельный blockGroup с children при наличии -->
  </div>
</div>
```

- Сохраняются `id`, type, props, inline content и `children`.
- `data-level` и тег `<hN>` должны описывать один уровень; при конфликте импортёр
  следует документированному приоритету служебных attrs.
- Повторный доверенный импорт восстанавливает эквивалентный `HeadingBlock`.

## Экспорт в interoperable HTML

Heading экспортируется семантическим элементом своего уровня:

```html
<h2 style="color: #1d4ed8; text-align: center">
  Заголовок <strong>раздела</strong>
</h2>
```

- Inline content сериализуется стандартными HTML elements и минимальными styles.
- Отличающиеся от defaults block props экспортируются как переносимые CSS-
  declarations.
- Default colors и `textAlignment: "left"` не создают лишних styles.
- `id` и служебные attrs BlockNote не обязательны и не экспортируются.
- Пользовательский текст и значения attrs корректно экранируются.

## Дочерние блоки

- `children` не помещаются внутрь `<hN>`.
- В полном HTML отдельный `blockGroup` сохраняет исходную вложенность.
- В interoperable HTML дети выводятся после `<hN>` как соседние blocks.
- Потеря вложенности сопровождается warning.

## Безопасность

- `<script>`, event-handler attrs и опасные URL не выполняются и не импортируются
  как активный код.
- CSS обрабатывается по allowlist поддерживаемых свойств и значений.
- Неизвестные inline elements сохраняют читаемый текст, когда это безопасно.
- Импорт использует HTML parser, а не регулярные выражения.
- Экспорт экранирует пользовательский текст и значения атрибутов.

## Round trip

В полном доверенном HTML round trip сохраняет `id`, type, `level`, стандартные
props, inline content и children. В interoperable HTML сохраняются тип, `level`,
видимый текст, поддерживаемые inline styles и переносимые block props; ID создаётся
заново, а children могут потерять вложенность.

## Критерии приёмки

1. `<h1>`–`<h6>` импортируются как Heading соответствующего уровня.
2. Пустой `<hN>` создаёт Heading с `content: []`.
3. Inline elements преобразуются согласно модели `InlineContent`.
4. Block-level и inline colors не смешиваются.
5. Full HTML round trip сохраняет `id`, `level`, props, content и children.
6. Interoperable export создаёт семантический `<h1>`–`<h6>`.
7. Default props не создают лишних inline styles.
8. Children не помещаются внутрь `<hN>`; lossy flattening диагностируется.
9. Небезопасная разметка не исполняется и не попадает в документ как активный код.
10. Конфликт уровня в полном HTML разрешается детерминированно.

## Открытые вопросы для проверки по эталону

- точная форма служебных attrs и wrappers полного BlockNote HTML;
- приоритет `data-level` и имени `<hN>` при конфликте;
- нормализация пустого `<hN>` и `<hN><br></hN>`;
- сохранение whitespace вокруг inline elements;
- допустимый набор CSS colors и значений `text-align`;
- импорт malformed HTML с block-level elements внутри Heading.
