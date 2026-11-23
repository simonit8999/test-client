import { memo, useEffect } from 'react'
import { Clock, Check, ArrowRight } from 'lucide-react'
import type { AppConfig, Service } from '../types'
import { formatDuration, fmtPrice } from '../utils/format'

interface Props {
  readonly config: AppConfig
  readonly selected: Service | null
  readonly onSelect: (s: Service) => void
  readonly onNext: () => void
}

/**
 * ПРОИЗВОЛЬНЫЙ КЭШ ПРЕЛОАДА КАРТИНОК (осознанное решение, не утечка).
 * Держит декодированные текстуры «живыми», чтобы Chrome не выкидывал их из
 * GPU-памяти во время кроссфейдов между экранами (фикс чёрного мерцания,
 * см. .gpu-pinned в index.css). Кэш ограничен списком услуг клиента и живёт
 * на уровне модуля — раньше он вечно висел на window через any-каст.
 */
const imageCache = new Map<string, HTMLImageElement>()

function preloadImages(urls: readonly string[]) {
  for (const url of urls) {
    if (imageCache.has(url)) continue
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    imageCache.set(url, img)
  }
}

interface CardProps {
  readonly service: Service
  readonly active: boolean
  readonly onSelect: (s: Service) => void
}

// memo + стабильный onSelect: при выборе услуги перерисовываются только
// карточки, у которых сменился active, а не весь список.
// Тап-эффект — CSS active:scale вместо motion.button (без JS-анимации на тап).
const ServiceCard = memo(function ServiceCard({ service, active, onSelect }: CardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(service)}
      className="relative overflow-hidden rounded-2xl border text-left cursor-pointer bg-ink/40 transition-[border-color,box-shadow,transform] duration-200 active:scale-[0.97]"
      style={{ minHeight: 120, borderColor: active ? 'var(--accent)' : 'rgba(255,255,255,0.1)', boxShadow: active ? '0 0 20px rgba(229,229,229,0.2)' : 'none' }}
    >
      <div className="absolute inset-0">
        <img src={service.image} alt="" className="w-full h-full object-cover opacity-50 gpu-pinned" draggable={false} loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/20" />
      </div>
      <div className="relative p-4 flex flex-col justify-between min-h-[120px] z-10">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display font-bold text-lg uppercase tracking-tight leading-tight">{service.name}</h3>
          <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${active ? 'bg-accent text-ink shadow-glow' : 'bg-white/10 border border-white/15 text-transparent'}`}>
            <Check className="w-3.5 h-3.5" strokeWidth={3} />
          </div>
        </div>
        <div className="flex items-end justify-between gap-3 mt-4">
          {service.duration_minutes > 0 ? (
            <div className="flex items-center gap-1.5 text-[12px] text-zincsoft">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(service.duration_minutes)}
            </div>
          ) : (
            <div className="text-[12px] text-zincsoft">Под ваш запрос</div>
          )}
          <div className="font-display font-extrabold text-xl tracking-tight text-white whitespace-nowrap">{fmtPrice(service.price)}</div>
        </div>
      </div>
    </button>
  )
})

function Screen2Service({ config, selected, onSelect, onNext }: Props) {
  useEffect(() => {
    preloadImages(config.services.map((s) => s.image))
  }, [config.services])

  return (
    <div className="flex flex-col h-full overflow-hidden relative bg-ink">
      <div className="absolute inset-0 z-0">
        <img src={config.hero_image} alt="" className="w-full h-full object-cover opacity-15 gpu-pinned" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/80 via-ink/95 to-ink" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="pt-2 pb-4 px-5 shrink-0">
          <h1 className="font-display font-black text-[28px] leading-tight tracking-tight uppercase">Выберите услугу</h1>
          <p className="mt-1.5 text-white/50 text-sm">Всё, что нужно вашему авто — в одном месте</p>
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-4">
          <div className="flex flex-col gap-4">
            {config.services.map((s) => (
              <ServiceCard key={s.id} service={s} active={selected?.id === s.id} onSelect={onSelect} />
            ))}
          </div>
        </div>

        <div className="shrink-0 p-5 pb-safe bg-ink/95 border-t border-white/5">
          <button
            type="button"
            disabled={!selected}
            onClick={onNext}
            className={`w-full h-14 rounded-full font-semibold text-[15px] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.96] ${selected ? 'bg-accent text-ink shadow-glow' : 'bg-white/[0.06] text-white/30 cursor-not-allowed'}`}
          >
            Далее <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(Screen2Service)