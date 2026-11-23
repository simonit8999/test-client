import { memo, useCallback, useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { ArrowRight, Car, Hash, User, MessageSquare, Phone } from 'lucide-react'
import type { BookingData } from '../types'

interface Props {
  readonly data: BookingData
  readonly onChange: (patch: Partial<BookingData>) => void
  readonly onNext: () => void
}

/** «+7 (999) 000-00-00» из сырого ввода. */
function formatPhone(raw: string): string {
  let digits = raw.replace(/\D/g, '')
  // В поле уже стоит префикс «+7», поэтому первая цифра — это код страны,
  // а не часть номера. Заодно понимаем вставку «7999…» и «8999…».
  // Без этого «съедалась» первая цифра: 9991234567 → +7 (991) 234-56-7.
  if (/^\s*\+?[78]/.test(raw)) digits = digits.slice(1)
  // Национальный номер — максимум 10 цифр.
  if (digits.length > 10) digits = digits.slice(0, 10)

  let formatted = ''
  if (digits.length > 0) {
    formatted = `+7 (${digits.slice(0, 3)}`
    if (digits.length > 3) formatted += `) ${digits.slice(3, 6)}`
    if (digits.length > 6) formatted += `-${digits.slice(6, 8)}`
    if (digits.length > 8) formatted += `-${digits.slice(8, 10)}`
  }
  return formatted
}

interface Draft {
  readonly carModel: string
  readonly plate: string
  readonly name: string
  readonly phone: string
  readonly comment: string
}

function Screen3Details({ data, onChange, onNext }: Props) {
  // Черновик формы живёт локально: каждый ввод символа ре-рендерит только этот
  // экран, а не App + Header + ProgressBar целиком (так было при контроле из App).
  const [draft, setDraft] = useState<Draft>(() => ({
    carModel: data.carModel,
    plate: data.plate,
    name: data.name,
    phone: data.phone,
    comment: data.comment,
  }))
  const draftRef = useRef(draft)
  draftRef.current = draft

  // При покидании шага (вперёд ИЛИ назад) сохраняем черновик в общий state,
  // чтобы пользователь не терял ввод при возврате на шаг.
  useEffect(() => () => { onChange(draftRef.current) }, [onChange])

  const setField = useCallback((key: keyof Draft, value: string) => {
    setDraft((d) => (d[key] === value ? d : { ...d, [key]: value }))
  }, [])

  const handlePhoneChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setField('phone', formatPhone(e.target.value))
  }, [setField])

  const valid = draft.name.trim().length > 0 && draft.carModel.trim().length > 0 && draft.phone.replace(/\D/g, '').length >= 11

  const handleSubmit = useCallback(() => {
    if (!valid) return
    onChange(draftRef.current)
    onNext()
  }, [valid, onChange, onNext])

  return (
    <div className="flex flex-col h-full bg-ink overflow-hidden">
      <div className="pt-2 pb-5 px-5 shrink-0">
        <h1 className="font-display font-black text-[28px] leading-tight tracking-tight uppercase">Детали вашего авто</h1>
        <p className="mt-1.5 text-zincsoft text-sm">Так мы подготовимся к вашему визиту</p>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-4">
        <form
          className="flex flex-col gap-3.5"
          onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
        >
          <Field icon={<User className="w-4 h-4" />} label="Ваше имя *">
            <input value={draft.name} onChange={(e) => setField('name', e.target.value)} placeholder="Александр" className="w-full bg-transparent outline-none text-[15px] placeholder:text-white/25" />
          </Field>

          <Field icon={<Phone className="w-4 h-4" />} label="Номер телефона *">
            <input
              type="tel"
              value={draft.phone}
              onChange={handlePhoneChange}
              placeholder="+7 (999) 000-00-00"
              className="w-full bg-transparent outline-none text-[15px] placeholder:text-white/25"
            />
          </Field>

          <Field icon={<Car className="w-4 h-4" />} label="Марка и модель *">
            <input value={draft.carModel} onChange={(e) => setField('carModel', e.target.value)} placeholder="BMW M5" className="w-full bg-transparent outline-none text-[15px] placeholder:text-white/25" />
          </Field>

          <Field icon={<Hash className="w-4 h-4" />} label="Номер авто (опционально)">
            <input value={draft.plate} onChange={(e) => setField('plate', e.target.value)} placeholder="А123ВС 77" className="w-full bg-transparent outline-none text-[15px] uppercase placeholder:text-white/25" />
          </Field>

          <div className="rounded-2xl bg-surface/60 border border-white/10 p-4 glow-focus transition-shadow">
            <div className="flex items-center gap-2 mb-2 text-[11px] uppercase tracking-[0.16em] text-zincsoft font-medium">
              <MessageSquare className="w-3.5 h-3.5" />
              Комментарий (опционально)
            </div>
            <textarea value={draft.comment} onChange={(e) => setField('comment', e.target.value)} placeholder="Царапина на двери, нужна химчистка" rows={3} className="w-full bg-transparent outline-none text-[15px] resize-none placeholder:text-white/25" />
          </div>
        </form>
      </div>

      <div className="shrink-0 p-5 pb-safe bg-ink border-t border-white/5">
        <button
          type="button"
          disabled={!valid}
          onClick={handleSubmit}
          className={`w-full h-14 rounded-full font-semibold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.96] ${
            valid ? 'bg-accent text-ink shadow-glow' : 'bg-white/[0.06] text-white/30 cursor-not-allowed'
          }`}
        >
          Выбрать время <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

export default memo(Screen3Details)

function Field({ children, icon, label }: { children: ReactNode; icon: ReactNode; label: string }) {
  return (
    <label className="rounded-2xl bg-surface/60 border border-white/10 p-4 glow-focus transition-shadow block">
      <div className="flex items-center gap-2 mb-2 text-[11px] uppercase tracking-[0.16em] text-zincsoft font-medium">
        {icon}
        {label}
      </div>
      {children}
    </label>
  )
}