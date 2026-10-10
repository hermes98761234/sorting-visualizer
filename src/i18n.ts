export type Lang = 'en' | 'uk'
export type T = (s: string, ...args: (string | number)[]) => string

/** Marks a string for translation where it is defined away from its t() call. */
export const N = (s: string) => s

/** English source string → Ukrainian. `{0}`, `{1}` are placeholders for interpolated values. */
export const UK: Record<string, string> = {
  'Source on GitHub': 'Код на GitHub',
  Language: 'Мова',
  Theme: 'Тема',
  System: 'Системна',
  Light: 'Світла',
  Dark: 'Темна',
  'Bubble sort': 'Сортування бульбашкою',
  'Insertion sort': 'Сортування вставками',
  'Selection sort': 'Сортування вибором',
  'Merge sort': 'Сортування злиттям',
  'Quicksort': 'Швидке сортування',
  'Heap sort': 'Пірамідальне сортування',
  'Shell sort': 'Сортування Шелла',
  'Radix sort (LSD)': 'Порозрядне сортування (LSD)',
  'Random': 'Випадкові',
  'Nearly sorted': 'Майже впорядковані',
  'Reversed': 'У зворотному порядку',
  'Few unique': 'Мало унікальних',
  'Sorting Visualizer': 'Візуалізатор сортування',
  'Watch eight sorting algorithms work, step by step.': 'Дивіться, як працюють вісім алгоритмів сортування, крок за кроком.',
  'Pause': 'Пауза',
  'Replay': 'Знову',
  'Play': 'Старт',
  'Step back': 'Крок назад',
  'Step forward': 'Крок вперед',
  'Step': 'Крок',
  'Reset': 'Скинути',
  'Speed': 'Швидкість',
  'Size: {0}': 'Розмір: {0}',
  'Data': 'Дані',
  'New data': 'Нові дані',
  'Sound': 'Звук',
  'Comparisons': 'Порівняння',
  'Swaps': 'Обміни',
  'Writes': 'Записи',
  'Steps': 'Кроки',
  'Totals for this run: cmp / swap / write': 'Усього за прогін: порівн. / обміни / записи',
  'Best': 'Найкращий',
  'Average': 'Середній',
  'Worst': 'Найгірший',
  'Extra space': 'Додаткова пам\'ять',
  'Stable': 'Стабільне',
  'yes': 'так',
  'no': 'ні',
  'Amber bars are being compared, red bars are being moved or written, green means sorted.': 'Бурштинові стовпчики порівнюються, червоні переміщуються або записуються, зелені — відсортовано.',
  'Counts are exact for the data shown. Share the page URL to share the setup.': 'Лічильники точні для показаних даних. Поділіться URL сторінки, щоб поділитися налаштуванням.',
}

export function tr(lang: Lang, s: string, ...args: (string | number)[]): string {
  const src = lang === 'uk' ? (UK[s] ?? s) : s
  return src.replace(/\{(\d+)\}/g, (_, i: string) => String(args[+i]))
}
