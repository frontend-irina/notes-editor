# Блоки элементов списка

## Назначение

BlockNote представляет список не отдельным блоком-контейнером, а последовательностью
блоков-элементов списка. Поддерживаются четыре стандартных типа:

- `bulletListItem` — маркированный элемент;
- `numberedListItem` — нумерованный элемент;
- `checkListItem` — элемент с флажком;
- `toggleListItem` — элемент, дочерние блоки которого можно скрыть или показать.

Реализация надстройки над Tiptap должна сохранять публичную модель этих блоков и
наблюдаемое поведение BlockNote.

Основной источник: [BlockNote — List Types](https://www.blocknotejs.org/docs/features/blocks/list-types).

Связанные спецификации:

- [Идентификатор блока](../block-id.md);
- [Inline Content](../inline-content.md);
- [HTML](../html.md);
- [Markdown](../markdown.md).

## Общая модель

Все элементы списка являются обычными блоками документа с inline-содержимым и
массивом дочерних блоков:

```ts
type ListItemBlock =
  | BulletListItemBlock
  | NumberedListItemBlock
  | CheckListItemBlock
  | ToggleListItemBlock;

type BulletListItemBlock = {
  id: string;
  type: "bulletListItem";
  props: DefaultProps;
  content: InlineContent[];
  children: Block[];
};

type NumberedListItemBlock = {
  id: string;
  type: "numberedListItem";
  props: DefaultProps & {
    start?: number;
  };
  content: InlineContent[];
  children: Block[];
};

type CheckListItemBlock = {
  id: string;
  type: "checkListItem";
  props: DefaultProps & {
    checked: boolean;
  };
  content: InlineContent[];
  children: Block[];
};

type ToggleListItemBlock = {
  id: string;
  type: "toggleListItem";
  props: DefaultProps;
  content: InlineContent[];
  children: Block[];
};
```

`DefaultProps` включает стандартные свойства блока:

| Свойство | Тип | Значение по умолчанию |
| --- | --- | --- |
| `backgroundColor` | `string` | `"default"` |
| `textColor` | `string` | `"default"` |
| `textAlignment` | `"left" \| "center" \| "right" \| "justify"` | `"left"` |

Формат `id` определяется в [block-id.md](../block-id.md), а формат текста,
ссылок и inline-стилей — в [inline-content.md](../inline-content.md).

## Общие правила

- `content` содержит подпись элемента списка и может быть пустым массивом.
- `children` содержит структурно вложенные блоки. Вложенные элементы списка
  формируют следующий уровень списка.
- Перемещение элемента, изменение вложенности и преобразование между совместимыми
  типами не должны менять его `id`.
- Маркер, номер, checkbox и toggle-кнопка являются интерфейсом блока и не входят в
  `content`.
- Соседние совместимые элементы визуально объединяются в список средствами
  представления. Дополнительный публичный блок-контейнер для этого не создаётся.
- Ввод, удаление, разделение, объединение, копирование, вставка, drag-and-drop,
  nest/unnest и undo/redo используют общие правила блочного редактора.

## Маркированный элемент

`bulletListItem` отображается с ненумерованным маркером.

- Специальных props помимо `DefaultProps` нет.
- В публичном JSON символ маркера не хранится.
- Вид маркера может зависеть от темы и уровня вложенности, но не меняет модель
  документа.

```json
{
  "id": "0198f123-4567-7abc-8def-0123456789ab",
  "type": "bulletListItem",
  "props": {
    "backgroundColor": "default",
    "textColor": "default",
    "textAlignment": "left"
  },
  "content": [{ "type": "text", "text": "Первый пункт", "styles": {} }],
  "children": []
}
```

## Нумерованный элемент

`numberedListItem` отображается с номером и дополнительно поддерживает prop
`start?: number`.

- `start` задаёт номер данного элемента.
- Если `start` не указан и перед элементом нет продолжаемого нумерованного списка,
  нумерация начинается с `1`.
- Если `start` не указан после предыдущего совместимого нумерованного элемента,
  отображаемое значение увеличивается относительно предыдущего элемента.
- Явный `start` переопределяет автоматически вычисленный номер и позволяет начать
  или продолжить список с нужного значения.
- Вычисленный номер не следует записывать в `content`.

```json
{
  "id": "0198f123-4567-7abc-8def-0123456789ab",
  "type": "numberedListItem",
  "props": {
    "backgroundColor": "default",
    "textColor": "default",
    "textAlignment": "left",
    "start": 3
  },
  "content": [{ "type": "text", "text": "Третий пункт", "styles": {} }],
  "children": []
}
```

## Элемент с флажком

`checkListItem` отображает флажок, который пользователь может переключать.

- `checked: false` означает невыполненный элемент.
- `checked: true` означает выполненный элемент.
- Переключение флажка меняет только `props.checked`; `id`, `content` и `children`
  сохраняются.
- Состояние является частью документа, сериализуется и участвует в undo/redo.
- В read-only режиме состояние отображается, но не изменяется.

```json
{
  "id": "0198f123-4567-7abc-8def-0123456789ab",
  "type": "checkListItem",
  "props": {
    "backgroundColor": "default",
    "textColor": "default",
    "textAlignment": "left",
    "checked": false
  },
  "content": [{ "type": "text", "text": "Выполнить задачу", "styles": {} }],
  "children": []
}
```

## Сворачиваемый элемент

`toggleListItem` позволяет скрывать и показывать свои `children`.

- Специального prop для состояния раскрытия в опубликованной модели блока нет.
- Переключение видимости не удаляет и не изменяет дочерние блоки.
- Элемент без `children` сохраняет тип `toggleListItem`, но скрывать ему нечего.
- Текущее состояние раскрытия следует считать состоянием представления, пока иной
  сериализуемый контракт не будет подтверждён отдельной спецификацией.

```json
{
  "id": "0198f123-4567-7abc-8def-0123456789ab",
  "type": "toggleListItem",
  "props": {
    "backgroundColor": "default",
    "textColor": "default",
    "textAlignment": "left"
  },
  "content": [{ "type": "text", "text": "Подробности", "styles": {} }],
  "children": [
    {
      "id": "0198f123-4567-7abc-8def-0123456789ac",
      "type": "paragraph",
      "props": {
        "backgroundColor": "default",
        "textColor": "default",
        "textAlignment": "left"
      },
      "content": [{ "type": "text", "text": "Скрываемый текст", "styles": {} }],
      "children": []
    }
  ]
}
```

## Преобразование и редактирование

- Создание и преобразование через slash menu, меню типа блока и публичный API
  должны приводить к одному и тому же публичному JSON.
- При преобразовании совместимого inline-блока сохраняются `id`, `content`,
  `children` и совместимые `DefaultProps`.
- При преобразовании в `checkListItem` отсутствующий `checked` получает значение
  `false`.
- При преобразовании из `checkListItem` prop `checked` удаляется, если целевой тип
  его не поддерживает.
- При преобразовании из `numberedListItem` prop `start` удаляется, если целевой тип
  его не поддерживает.
- Изменение вложенности влияет на визуальную группировку и нумерацию, но не должно
  менять inline-содержимое элемента.

Конкретные input rules, горячие клавиши и пограничное поведение `Enter`,
`Backspace` и `Delete` исходная страница не определяет. Их следует проверять по
эталонному редактору и фиксировать в общей спецификации клавиатурного поведения.

## Форматы обмена

Правила импорта, экспорта и round trip вынесены в общие спецификации:

- [HTML — элементы списка](../html.md#элементы-списка);
- [Markdown — элементы списка](../markdown.md#элементы-списка).

## Критерии приёмки

1. Все четыре типа сериализуются с точными значениями `type` из публичной модели
   BlockNote.
2. Каждый элемент содержит `id`, `props`, `content` и `children`.
3. Маркеры и вычисленные номера не попадают в `content`.
4. `numberedListItem.start` задаёт явный номер, а при его отсутствии нумерация
   начинается с `1` или продолжается от предыдущего элемента.
5. Переключение `checkListItem` сохраняет `checked` в документе и поддерживает
   undo/redo.
6. Переключение `toggleListItem` меняет только видимость `children`, не удаляя их.
7. Вложение и извлечение блока сохраняют его `id`, props и inline-содержимое.
