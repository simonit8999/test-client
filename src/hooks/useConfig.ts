import { useEffect, useState } from 'react'
import { isAppConfig, type AppConfig, type Service } from '../types'

const TELEGRAM_USERNAME_RE = /^[a-zA-Z0-9_]{5,32}$/

/** Путь с ведущим слешем приводим к BASE_URL, чтобы ресурсы работали и в подпапке (GitHub Pages). */
function assetPath(p: string): string {
  if (!p.startsWith('/')) return p
  return `${import.meta.env.BASE_URL}${p.replace(/^\/+/, '')}`
}

/**
 * Валидация + нормализация конфига. Возвращает новый объект,
 * не мутируя распарсенный JSON (раньше telegram_username правился на месте).
 */
function sanitizeConfig(raw: unknown): AppConfig | null {
  if (!isAppConfig(raw)) return null
  const services: readonly Service[] = raw.services.map((s) => ({ ...s, image: assetPath(s.image) }))
  return {
    ...raw,
    telegram_username: TELEGRAM_USERNAME_RE.test(raw.telegram_username) ? raw.telegram_username : '',
    hero_image: assetPath(raw.hero_image),
    services,
  }
}

function setMetaContent(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function hexToRgb(hex: string) {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  if (!m) return null
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

function applyMeta(config: AppConfig) {
  const rgb = hexToRgb(config.accent_color)
  if (rgb) document.documentElement.style.setProperty('--accent', `${rgb.r} ${rgb.g} ${rgb.b}`)
  setMetaContent('name', 'theme-color', config.accent_color)
  document.title = `${config.business_name} — Онлайн-запись`

  // Динамические OG-теги (Telegram-краулер JS не исполняет, но для других шаринга пригодится).
  // hero_image уже нормализован к BASE_URL, поэтому просто разрешаем его относительно страницы.
  setMetaContent('property', 'og:title', `${config.business_name} — Онлайн-запись`)
  setMetaContent('property', 'og:description', config.hero_subtitle)
  setMetaContent('property', 'og:image', new URL(config.hero_image, document.baseURI).href)
  setMetaContent('property', 'og:url', window.location.href)
}

export function useConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    const clientName = import.meta.env.VITE_CLIENT || 'demo'
    // BASE_URL — для корректной работы на GitHub Pages (подпапка репозитория)
    const jsonPath = `${import.meta.env.BASE_URL}clients/${clientName}.json`

    fetch(jsonPath, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<unknown>
      })
      .then((raw) => {
        const data = sanitizeConfig(raw)
        if (!data) throw new Error('Некорректный формат файла конфигурации')
        if (cancelled) return
        setConfig(data)
        applyMeta(data)
      })
      .catch((e: unknown) => {
        if (cancelled || (e instanceof DOMException && e.name === 'AbortError')) return
        setError(e instanceof Error ? e.message : 'Не удалось загрузить конфигурацию')
      })

    // Очистка: отменяем запрос при размонтировании — без этого fetch успевал
    // сделать setState на размонтированном компоненте (утечка/гонки, StrictMode).
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  return { config, error }
}