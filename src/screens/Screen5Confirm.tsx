import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Send, Sparkles, Copy, Check } from 'lucide-react'
import type { AppConfig, BookingData } from '../types'
import { fmtPrice, formatLongDate } from '../utils/format'

interface Props {
  readonly config: AppConfig
  readonly data: BookingData
}

/**
 * Копирование с фолбэком: clipboard API недоступен в небезопасном контексте
 * (http) и части WebView. Раньше промис молча реджектился — кнопка «не работала».
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const copied = document.execCommand('copy')
      document.body.removeChild(ta)
      return copied
    } catch {
      return false
    }
  }
}

/**
 * Флаг, который сам сбрасывается через delay мс. Таймер хранится в ref и
 * чистится при размонтировании: раньше setTimeout без очистки вызывал
 * setState на уже удалённом с экрана компоненте.
 */
function useTemporaryFlag(delay: number) {
  const [value, setValue] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const activate = useCallback(() => {
    setValue(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setValue(false), delay)
  }, [delay])

  return [value, activate] as const
}

function Screen5Confirm({ config, data }: Props) {
  const [copied, showCopied] = useTemporaryFlag(2000)
  const [copyFailed, showCopyFailed] = useTemporaryFlag(2000)
  const total = data.service?.price ?? 0

  const getMessageText = () => {
    return [
      `🚗 Новая заявка — ${config.business_name}`, ``,
      `Услуга: ${data.service?.name ?? '—'}`,
      `Авто: ${data.carModel || '—'}${data.plate ? ` (${data.plate})` : ''}`,
      `Дата: ${data.date ? formatLongDate(data.date) : '—'}`,
      `Время: ${data.time ?? '—'}`,
      `Имя: ${data.name || '—'}`,
      `Телефон: ${data.phone || '—'}`,
      data.comment ? `Комментарий: ${data.comment}` : '', ``,
      `Итого: ${fmtPrice(total)}`,
    ].filter(Boolean).join('\n')
  }

  const handleSend = () => {
    if (!data.service) return
    // Личные данные уходят в query-string t.me — это архитектура продукта;
    // encodeURIComponent экранирует переводы строк и спецсимволы.
    const text = getMessageText()
    const url = `https://t.me/${config.telegram_username}?text=${encodeURIComponent(text)}`
    if (navigator.vibrate) navigator.vibrate(50)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleCopy = async () => {
    const ok = await copyToClipboard(getMessageText())
    if (ok) {
      showCopied()
      if (navigator.vibrate) navigator.vibrate([50, 50, 50])
    } else {
      showCopyFailed()
    }
  }

  return (
    <div className="flex flex-col h-full bg-ink overflow-hidden">
      <div className="pt-2 pb-5 px-5 shrink-0">
        <h1 className="font-display font-black text-[28px] leading-tight tracking-tight uppercase">Всё верно?</h1>
        <p className="mt-1.5 text-zincsoft text-sm">Проверьте детали перед отправкой</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {/* backdrop-blur-xl убран (дорого на мобильных), декоративное свечение оставлено */}
        <div className="relative rounded-3xl p-6 border border-white/10 bg-glass overflow-hidden">
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-accent font-semibold"><Sparkles className="w-3.5 h-3.5" /> Ваша заявка</div>
            <Row label="Услуга" value={data.service?.name ?? '—'} />
            <Row label="Авто" value={`${data.carModel || '—'}${data.plate ? ` · ${data.plate}` : ''}`} />
            <Row label="Дата" value={data.date ? formatLongDate(data.date) : '—'} />
            <Row label="Время" value={data.time ?? '—'} />
            <Row label="Имя" value={data.name || '—'} />
            <Row label="Телефон" value={data.phone || '—'} />
            {data.comment && <Row label="Комментарий" value={data.comment} />}
            <div className="mt-5 pt-5 border-t border-white/10">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zincsoft font-medium mb-1">Итого</div>
              <div className="font-display font-black text-4xl tracking-tight">{fmtPrice(total)}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="shrink-0 p-5 pb-safe bg-ink border-t border-white/5">
        {config.telegram_username ? (
          <>
            <button type="button" onClick={handleSend} className="w-full h-14 rounded-full bg-accent text-ink font-semibold text-[15px] flex items-center justify-center gap-2 shadow-glow active:shadow-glowlg active:scale-[0.96] transition-shadow mb-3">
              <Send className="w-4 h-4" strokeWidth={2.4} />Отправить заявку в Telegram
            </button>
            <button type="button" onClick={handleCopy} className="w-full h-12 rounded-full bg-white/5 text-white font-medium text-[14px] flex items-center justify-center gap-2 hover:bg-white/10 transition-colors active:scale-[0.97]">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copyFailed ? 'Не удалось скопировать — проверьте права браузера' : copied ? 'Текст скопирован!' : 'Скопировать текст заявки'}
            </button>
          </>
        ) : (
          <button type="button" onClick={handleCopy} className="w-full h-14 rounded-full bg-accent text-ink font-semibold text-[15px] flex items-center justify-center gap-2 shadow-glow transition-shadow active:scale-[0.96]">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copyFailed ? 'Не удалось скопировать' : copied ? 'Текст скопирован!' : 'Скопировать заявку'}
          </button>
        )}
        <p className="mt-3 text-center text-[11px] text-zincsoft leading-relaxed">
          {config.telegram_username ? 'Нажимая кнопку, вы перейдёте в Telegram' : 'Отправьте скопированный текст в WhatsApp или Telegram'}
        </p>
      </div>
    </div>
  )
}

export default memo(Screen5Confirm)

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4">
      <div className="text-[11px] uppercase tracking-[0.16em] text-zincsoft font-medium">{label}</div>
      <div className="mt-0.5 text-[15px] font-medium text-white leading-snug">{value}</div>
    </div>
  )
}