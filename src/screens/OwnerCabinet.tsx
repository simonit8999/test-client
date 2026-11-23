import { memo, useCallback, useState, type ReactNode } from 'react'
import { m as motion, useReducedMotion } from '../motion'
import { ArrowLeft, TrendingUp, Users, Calendar, MessageSquare, Lock, Car, Check, X, Clock } from 'lucide-react'
import type { AppConfig } from '../types'
import { fmtPrice } from '../utils/format'

interface Props {
  readonly config: AppConfig
  readonly onBack: () => void
}

/** Статус визита — администратор отмечает его вручную в расписании. */
type VisitStatus = 'pending' | 'arrived' | 'no_show'

interface Appointment {
  readonly id: string
  readonly time: string
  readonly name: string
  readonly service: string
  readonly car: string
  readonly price: number
  readonly durationMinutes: number
  readonly initialStatus: VisitStatus
}

// Демо-расписание на сегодня. В реальной CRM приходит с бэкенда; здесь данные
// статичны, но статусы интерактивные (useState ниже).
const schedule: readonly Appointment[] = [
  { id: 'a1', time: '10:00', name: 'Александр', service: 'Комплексная мойка', car: 'BMW M5 · А123ВС 77', price: 4500, durationMinutes: 90, initialStatus: 'arrived' },
  { id: 'a2', time: '11:30', name: 'Мария', service: 'Химчистка салона', car: 'Kia Rio · В777АА 50', price: 6800, durationMinutes: 120, initialStatus: 'arrived' },
  { id: 'a3', time: '12:00', name: 'Дмитрий', service: 'Полировка', car: 'Audi A6 · О318ММ 99', price: 12000, durationMinutes: 180, initialStatus: 'no_show' },
  { id: 'a4', time: '13:30', name: 'Елена', service: 'Комплексная мойка', car: 'Lada Vesta · Т450КХ 77', price: 4500, durationMinutes: 90, initialStatus: 'pending' },
  { id: 'a5', time: '15:00', name: 'Игорь', service: 'Керамика', car: 'Toyota Camry · Н902ОР 77', price: 25000, durationMinutes: 240, initialStatus: 'pending' },
  { id: 'a6', time: '16:30', name: 'Ольга', service: 'Салон + мойка', car: 'VW Tiguan · Е663СС 50', price: 8900, durationMinutes: 150, initialStatus: 'pending' },
  { id: 'a7', time: '18:00', name: 'Сергей', service: 'Полировка', car: 'Skoda Octavia · М128РТ 99', price: 12000, durationMinutes: 180, initialStatus: 'pending' },
]

/** Записей за неделю — статичная демо-метрика. */
const WEEK_BOOKINGS = 41

const STATUS_LABEL: Record<VisitStatus, string> = {
  pending: 'Ожидается',
  arrived: 'Приехал',
  no_show: 'Не приехал',
}

const STATUS_BADGE_CLASS: Record<VisitStatus, string> = {
  pending: 'bg-white/5 text-white/60 border-white/10',
  arrived: 'bg-accent/15 text-accent border-accent/30',
  no_show: 'bg-red-500/15 text-red-400 border-red-500/30',
}

/** «90» → «1 ч 30 мин» — компактно для карточки расписания. */
function shortDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} мин`
  return m === 0 ? `${h} ч` : `${h} ч ${m} мин`
}

function OwnerCabinet({ config, onBack }: Props) {
  const reduce = useReducedMotion()

  // Отметки администратора: «Приехал» / «Не приехал» / «Ожидается».
  const [statuses, setStatuses] = useState<Record<string, VisitStatus>>(
    () => Object.fromEntries(schedule.map((a) => [a.id, a.initialStatus])),
  )
  const setStatus = useCallback((id: string, status: VisitStatus) => {
    setStatuses((prev) => (prev[id] === status ? prev : { ...prev, [id]: status }))
  }, [])

  const arrived = schedule.filter((a) => statuses[a.id] === 'arrived')
  const revenue = arrived.reduce((sum, a) => sum + a.price, 0)
  const handled = schedule.filter((a) => (statuses[a.id] ?? 'pending') !== 'pending').length
  const conversion = handled > 0 ? Math.round((arrived.length / handled) * 100) : 0

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, x: '100%' }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, x: '100%' }}
      transition={reduce ? { duration: 0.15 } : { type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 z-50 flex flex-col bg-ink"
    >
      <div className="safe-top px-5 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3 pt-4">
          <button onClick={onBack} aria-label="Назад к записи" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="text-[13px] text-white/50">Демо-кабинет</div>
            <div className="font-display font-bold text-lg truncate">{config.business_name}</div>
          </div>
        </div>
      </div>

      {/* no-scrollbar: прокрутка колесом/свайпом остаётся, но ползунок не рисуется */}
      <div className="no-scrollbar flex-1 overflow-y-auto overscroll-contain px-5 py-6 pb-20">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <div>
            <h2 className="font-display font-bold text-lg mb-3">Сегодня</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={<Calendar className="w-4 h-4" />} label="Записей" value={schedule.length} />
              <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Выручка" value={fmtPrice(revenue)} />
              <StatCard icon={<Users className="w-4 h-4" />} label="Конверсия" value={`${conversion}%`} />
              <StatCard icon={<MessageSquare className="w-4 h-4" />} label="За неделю" value={WEEK_BOOKINGS} />
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <h2 className="font-display font-bold text-lg">Расписание на сегодня</h2>
              <span className="text-[12px] text-white/40 whitespace-nowrap">
                {arrived.length} из {schedule.length} приехали
              </span>
            </div>
            <div className="space-y-2">
              {schedule.map((item) => (
                <AppointmentCard
                  key={item.id}
                  item={item}
                  status={statuses[item.id] ?? 'pending'}
                  onStatus={(status) => setStatus(item.id, status)}
                />
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-accent/10 border border-accent/20 p-4">
            <div className="flex items-center gap-2 text-accent font-bold text-sm mb-2">
              <Lock className="w-4 h-4" /> Тариф Business
            </div>
            <p className="text-[13px] text-white/70 leading-relaxed">
              В реальной версии здесь будет полноценная CRM: аналитика, история клиентов, напоминания,
              отметки о визитах и интеграция с WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default memo(OwnerCabinet)

/** Карточка записи: время, клиент, авто, сумма и переключатель статуса визита. */
function AppointmentCard({ item, status, onStatus }: {
  readonly item: Appointment
  readonly status: VisitStatus
  readonly onStatus: (status: VisitStatus) => void
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 transition-colors ${
        status === 'arrived'
          ? 'bg-accent/[0.06] border-accent/25'
          : status === 'no_show'
            ? 'bg-red-500/[0.06] border-red-500/20'
            : 'bg-surface/50 border-white/10'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="shrink-0 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-white/40" />
            <span className="font-display font-bold text-lg leading-none tabular-nums">{item.time}</span>
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm truncate">{item.name}</div>
            <div className="text-[12px] text-white/50 truncate">
              {item.service} · {shortDuration(item.durationMinutes)}
            </div>
            <div className="text-[11px] text-white/35 truncate flex items-center gap-1 mt-0.5">
              <Car className="w-3 h-3 shrink-0" />{item.car}
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-semibold text-sm whitespace-nowrap">{fmtPrice(item.price)}</div>
          <span className={`inline-flex mt-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_BADGE_CLASS[status]}`}>
            {STATUS_LABEL[status]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 mt-3" role="group" aria-label={`Статус визита: ${item.name}`}>
        <StatusButton active={status === 'arrived'} tone="accent" onClick={() => onStatus('arrived')}>
          <Check className="w-3.5 h-3.5" /> Приехал
        </StatusButton>
        <StatusButton active={status === 'no_show'} tone="danger" onClick={() => onStatus('no_show')}>
          <X className="w-3.5 h-3.5" /> Не приехал
        </StatusButton>
        <StatusButton active={status === 'pending'} tone="neutral" onClick={() => onStatus('pending')}>
          <Clock className="w-3.5 h-3.5" /> Ожидается
        </StatusButton>
      </div>
    </div>
  )
}

/** Кнопка-переключатель статуса: активная подсвечивается цветом тона. */
function StatusButton({ active, tone, onClick, children }: {
  readonly active: boolean
  readonly tone: 'accent' | 'danger' | 'neutral'
  readonly onClick: () => void
  readonly children: ReactNode
}) {
  const activeClass =
    tone === 'accent'
      ? 'bg-accent text-ink border-accent'
      : tone === 'danger'
        ? 'bg-red-500/90 text-white border-red-500'
        : 'bg-white/15 text-white border-white/25'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-8 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors active:scale-[0.97] ${
        active ? activeClass : 'bg-white/[0.03] text-white/50 border-white/10 hover:bg-white/[0.07]'
      }`}
    >
      {children}
    </button>
  )
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-surface/50 border border-white/10 p-4">
      <div className="flex items-center gap-2 text-white/50 text-[12px] mb-2">{icon}{label}</div>
      <div className="font-display font-bold text-xl tracking-tight">{value}</div>
    </div>
  )
}
