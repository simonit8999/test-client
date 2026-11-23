import type { ISODateString } from '../types'

// Intl-форматтер создаётся один раз, а не на каждый вызов (раньше — new NumberFormat при каждом fmt())
const priceFormatter = new Intl.NumberFormat('ru-RU')
/** Цена: 0 трактуем как «Бесплатно» (услуга-заглушка в демо), иначе «1 500 ₽». */
export const fmtPrice = (n: number): string => (n > 0 ? `${priceFormatter.format(n)} ₽` : 'Бесплатно')

const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const MONTHS_LONG = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
const WEEKDAYS_LONG = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']

export function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return many
  if (mod10 === 1) return one
  if (mod10 >= 2 && mod10 <= 4) return few
  return many
}

/** «90» → «1 час 30 минут», «60» → «1 час». */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const parts: string[] = []
  if (h > 0) parts.push(`${h} ${pluralRu(h, 'час', 'часа', 'часов')}`)
  if (m > 0) parts.push(`${m} ${pluralRu(m, 'минута', 'минуты', 'минут')}`)
  return parts.length > 0 ? parts.join(' ') : '—'
}

/**
 * Локальный YYYY-MM-DD. ВАЖНО: не использовать toISOString() — он отдаёт
 * UTC-дату, которая в РФ (UTC+) между 00:00 и 03:00 «уезжает» на день назад.
 */
export function toISODate(d: Date): ISODateString {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}` as ISODateString
}

/** Парсинг YYYY-MM-DD как ЛОКАЛЬНОЙ даты (new Date('YYYY-MM-DD') даёт UTC). */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** «6 мая» — для подписи выбранного дня. */
export function formatShortDate(d: Date): string {
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

/** «Пятница, 6 июня» — для текста заявки. */
export function formatLongDate(iso: string): string {
  const dt = parseISODate(iso)
  return `${WEEKDAYS_LONG[dt.getDay()]}, ${dt.getDate()} ${MONTHS_LONG[dt.getMonth()]}`
}