/**
 * Общие типы приложения.
 *
 * Соглашения:
 *  - конфиг (AppConfig) иммутабелен после загрузки → все поля readonly;
 *  - строки дат/времени брендированы, чтобы не путать их с произвольными строками
 *    (дата собирается только через toISODate() из utils/format).
 */

/** Дата в формате YYYY-MM-DD, построенная по ЛОКАЛЬНОМУ времени (не UTC). */
export type ISODateString = string & { readonly __brand: 'ISODateString' }

/** Время в формате HH:MM. */
export type TimeString = string & { readonly __brand: 'TimeString' }

export interface Service {
  readonly id: string
  readonly name: string
  readonly price: number
  /** Длительность услуги в минутах (вместо строкового «1 час»). */
  readonly duration_minutes: number
  readonly image: string
}

export interface WorkingHours {
  readonly start: TimeString
  readonly end: TimeString
  readonly slot_minutes?: number
}

export interface AppConfig {
  readonly business_name: string
  readonly logo_text: string
  readonly accent_color: string
  readonly telegram_username: string
  readonly phone: string
  readonly address: string
  readonly hero_image: string
  readonly hero_title: string
  readonly hero_subtitle: string
  readonly services: readonly Service[]
  readonly working_hours: WorkingHours
  /** Флаг демо-режима (показ баннера и демо-кабинета). */
  readonly isDemo?: boolean
}

export interface BookingData {
  readonly service: Service | null
  readonly carModel: string
  readonly plate: string
  readonly name: string
  readonly phone: string
  readonly comment: string
  readonly date: ISODateString | null
  readonly time: TimeString | null
}

/** Шаг мастера записи: 0 — лендинг, 1–4 — шаги. */
export type Step = 0 | 1 | 2 | 3 | 4

/** Режим отображения: мастер записи или демо-кабинет владельца. */
export type ViewMode = 'booking' | 'owner'

/** Направление перехода между экранами. */
export type Direction = 1 | -1

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

const TIME_RE = /^\d{2}:\d{2}$/

function isService(value: unknown): value is Service {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.price === 'number' &&
    typeof value.duration_minutes === 'number' &&
    typeof value.image === 'string'
  )
}

/**
 * Type-guard конфига клиента. Защищает приложение от битого/подменённого JSON:
 * раньше ответ fetch просто кастовался к AppConfig, и любая ошибка ломала UI молча.
 */
export function isAppConfig(value: unknown): value is AppConfig {
  if (!isRecord(value)) return false
  if (
    typeof value.business_name !== 'string' ||
    typeof value.logo_text !== 'string' ||
    typeof value.accent_color !== 'string' ||
    typeof value.telegram_username !== 'string' ||
    typeof value.phone !== 'string' ||
    typeof value.address !== 'string' ||
    typeof value.hero_image !== 'string' ||
    typeof value.hero_title !== 'string' ||
    typeof value.hero_subtitle !== 'string'
  ) return false
  if (!Array.isArray(value.services) || !value.services.every(isService)) return false
  if (!isRecord(value.working_hours)) return false
  if (typeof value.working_hours.start !== 'string' || !TIME_RE.test(value.working_hours.start)) return false
  if (typeof value.working_hours.end !== 'string' || !TIME_RE.test(value.working_hours.end)) return false
  if (value.working_hours.slot_minutes !== undefined && typeof value.working_hours.slot_minutes !== 'number') return false
  if (value.isDemo !== undefined && typeof value.isDemo !== 'boolean') return false
  return true
}