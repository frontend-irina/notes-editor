# Блок Paragraph

## Назначение

`Paragraph` — стандартный текстовый блок редактора. Его реализация и публичное
поведение должны полностью соответствовать блоку `paragraph` из BlockNote.

Источник поведения: [BlockNote — Typography / Paragraph](https://www.blocknotejs.org/docs/features/blocks/typography#paragraph).

Связанные спецификации:

- [Markdown для Paragraph](./markdown.md);
- [HTML для Paragraph](./html.md);
- [Идентификатор блока](../../block-id.md);
- [Inline Content](../../inline-content.md);
- [Formatting Toolbar](../../toolbar.md).

## Модель данных

```ts
type ParagraphBlock = {
  id: string;
  type: "paragraph";
  props: DefaultProps;
  content: InlineContent[];
  children: Block[];
};

type DefaultProps = {
  backgroundColor: string;
  textColor: string;
  textAlignment: "left" | "center" | "right" | "justify";
};
```

Требования к `id` определены в [block-id.md](../../block-id.md). Формат и
поведение `content` определены в [inline-content.md](../../inline-content.md).

## Поля

### `type`

- Всегда имеет значение `"paragraph"`.

### `props`

Paragraph использует стандартные свойства BlockNote:

| Свойство | Тип | Значение по умолчанию | Поведение |
| --- | --- | --- | --- |
| `backgroundColor` | `string` | `"default"` | Цвет фона блока; также наследуется вложенными блоками. |
| `textColor` | `string` | `"default"` | Цвет текста блока; также наследуется вложенными блоками. |
| `textAlignment` | `"left" \| "center" \| "right" \| "justify"` | `"left"` | Горизонтальное выравнивание текста блока. |

Именованные цвета темы и произвольные CSS-цвета должны обрабатываться так же,
как в BlockNote.

### `content`

- Содержит массив `InlineContent`.
- Пустой paragraph представлен пустым массивом: `content: []`.
- Текст, ссылки и стили не являются props блока и хранятся в `content`.
- Перенос строки между двумя параграфами не хранится внутри `content`: параграфы
  являются отдельными блоками.

### `children`

- Может содержать вложенные блоки.
- Inline-содержимое дочерних блоков не входит в `content` родительского paragraph.
- Перемещение и изменение вложенности не меняют `id` блока.

## Создание и преобразование

- Paragraph используется как базовый текстовый блок.
- Новый пустой документ должен содержать пустой paragraph.
- Создание блока без `props`, `content` или `children` подставляет их значения по
  умолчанию.
- Преобразование другого блока с inline-содержимым в paragraph сохраняет:
  - `id` преобразуемого блока;
  - совместимое inline-содержимое вместе со ссылками и стилями;
  - массив `children` и его текущую вложенность;
  - совместимые стандартные props: `backgroundColor`, `textColor` и
    `textAlignment`.
- Props исходного типа, которых нет в схеме paragraph, не должны попадать в
  итоговый `ParagraphBlock`.
- Комбинация `Mod-Alt-0` преобразует текущий блок с inline-содержимым в paragraph,
  как в BlockNote. `Mod` означает `Cmd` на macOS и `Ctrl` на остальных платформах.

## Редактирование

Paragraph должен участвовать в общих блочных операциях BlockNote без специальных
отклонений:

- ввод и редактирование inline-содержимого;
- обработка `Enter` в зависимости от состояния paragraph:
  - в непустом paragraph удаляет выделение, если оно есть, и разделяет блок в
    позиции курсора;
  - текст до курсора остаётся в исходном блоке, а текст после курсора переносится
    в новый paragraph под ним;
  - в начале непустого paragraph создаёт перед его содержимым новый пустой
    paragraph;
  - в пустом paragraph создаёт новый пустой paragraph под текущим;
  - если пустой paragraph имеет дочерние блоки, они переносятся в созданный под
    ним paragraph;
  - если пустой paragraph вложен, первое нажатие `Enter` в начале блока уменьшает
    уровень его вложенности вместо создания нового блока;
- `Shift-Enter` по умолчанию вставляет внутри paragraph жёсткий перенос строки
  (`hard break`) и не создаёт отдельный блок;
- объединение с соседним совместимым блоком клавишами удаления на границе;
- выделение, копирование, вырезание и вставка;
- drag-and-drop;
- изменение вложенности;
- преобразование через slash menu и block type menu;
- undo и redo.

Точные общие правила клавиатурного редактирования будут вынесены в спецификацию
поведения блочного редактора. Paragraph не должен переопределять их относительно
BlockNote.

## Форматы обмена

Форматные правила вынесены в отдельные документы:

- [markdown.md](./markdown.md) определяет импорт и экспорт Paragraph в Markdown;
- [html.md](./html.md) определяет импорт и экспорт Paragraph в полный BlockNote HTML
  и interoperable HTML.

Каноническим persistence-представлением Paragraph остаётся публичный JSON, а не
Markdown или interoperable HTML.

## Пример JSON

```json
{
  "id": "0198f123-4567-7abc-8def-0123456789ab",
  "type": "paragraph",
  "props": {
    "backgroundColor": "default",
    "textColor": "default",
    "textAlignment": "left"
  },
  "content": [
    {
      "type": "text",
      "text": "Обычный параграф",
      "styles": {}
    }
  ],
  "children": []
}
```

## Критерии приёмки

1. Публичное JSON-представление paragraph совпадает с моделью BlockNote.
2. Значения стандартных props и их defaults совпадают с BlockNote.
3. Пустой paragraph сериализуется с `content: []`.
4. Inline-содержимое корректно сохраняется после редактирования и повторной
   загрузки JSON.
5. `Mod-Alt-0` преобразует совместимый текущий блок в paragraph.
6. При преобразовании в paragraph сохраняются `id`, `children`, inline-содержимое,
   inline-стили и совместимые стандартные props; несовместимые props удаляются.
7. `Enter` разделяет непустой paragraph в позиции курсора с сохранением содержимого
   по обе стороны разделения.
8. `Enter` в пустом paragraph создаёт следующий пустой paragraph и переносит в
   него дочерние блоки, а в пустом вложенном paragraph сначала уменьшает уровень
   вложенности.
9. `Shift-Enter` вставляет жёсткий перенос строки внутри paragraph без создания
   нового блока.
10. Объединение, перемещение и изменение вложенности соответствуют наблюдаемому
    поведению BlockNote.
11. Импорт и экспорт Markdown соответствуют [markdown.md](./markdown.md).
12. Импорт и экспорт HTML соответствуют [html.md](./html.md).
