import { memo } from 'react'
import { m as motion, useReducedMotion } from '../motion'
import { ArrowRight, Phone, Send, MapPin } from 'lucide-react'
import type { AppConfig } from '../types'

interface Props {
  readonly config: AppConfig
  readonly onStart: () => void
}

interface EnterAnim {
  initial: { opacity: number; y?: number }
  animate: { opacity: number; y?: number }
  transition: { duration: number; delay: number }
}

/**
 * Появление блоков: полное смещение по Y либо (при prefers-reduced-motion)
 * короткое затухание. CSS-медиазапрос из index.css на JS-анимации framer-motion
 * не действует, поэтому reduced-motion обрабатываем здесь.
 */
function enterAnim(reduce: boolean | null, delay: number, y = 24): EnterAnim {
  if (reduce) {
    return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.15, delay: delay / 4 } }
  }
  return { initial: { opacity: 0, y }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay } }
}

function Screen1Hero({ config, onStart }: Props) {
  const reduce = useReducedMotion()
  const yandexMapsUrl = `https://yandex.ru/maps/?text=${encodeURIComponent(config.address)}`
  const telHref = `tel:${config.phone.replace(/[^\d+]/g, '')}`

  return (
    <div className="relative w-full h-full bg-ink overflow-hidden">

      {/* Фоновая картинка */}
      <div className="absolute inset-0 z-0">
        <img
          src={config.hero_image}
          alt={config.business_name}
          className="w-full h-full object-cover gpu-pinned"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-transparent to-transparent" />
      </div>

      {/* Контент. minHeight 100dvh убран: в демо над hero стоит баннер,
          и жёсткая высота вьюпорта обрезала бы нижние контакты. */}
      <div className="relative z-10 flex flex-col justify-end px-6 pb-8 safe-bottom [--safe-bottom-base:2rem] h-full">

        <motion.div {...enterAnim(reduce, 0.1, 20)} className="mb-auto pt-8 safe-top">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-accent flex items-center justify-center font-display font-black text-lg shadow-glow text-ink">
              B
            </div>
            <div>
              <div className="font-display font-extrabold tracking-[0.18em] text-sm uppercase">{config.logo_text}</div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-zincsoft">Detailing Studio</div>
            </div>
          </div>
        </motion.div>

        <motion.h1 {...enterAnim(reduce, 0.2)} className="font-display font-black text-[34px] leading-[1.05] tracking-tight uppercase">
          {config.hero_title}
        </motion.h1>

        <motion.p {...enterAnim(reduce, 0.3)} className="mt-3 text-zincsoft text-[15px] leading-relaxed max-w-sm">
          {config.hero_subtitle}
        </motion.p>

        <motion.button
          {...enterAnim(reduce, 0.4)}
          onClick={onStart}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          className="mt-8 group relative w-full h-14 rounded-full bg-accent text-ink font-semibold text-[15px] flex items-center justify-center gap-2 shadow-glow active:shadow-glowlg active:scale-[0.96] transition-shadow"
        >
          <span>Записаться</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
        </motion.button>

        <motion.div {...enterAnim(reduce, 0.5, 10)} className="flex items-center justify-center gap-2 mt-6 mb-2">
          <div className="flex -space-x-2">
            <div className="w-6 h-6 rounded-full bg-white/20 border border-ink" />
            <div className="w-6 h-6 rounded-full bg-white/30 border border-ink" />
            <div className="w-6 h-6 rounded-full bg-white/40 border border-ink" />
          </div>
          <span className="text-[11px] text-zincsoft">На этой неделе уже <span className="text-white font-semibold">14 записей</span></span>
        </motion.div>
        <motion.div {...enterAnim(reduce, 0.55, 0)} className="mt-6 flex flex-col items-center gap-2.5 text-[12px] text-zincsoft">
          <div className="flex items-center justify-center gap-4">
            <a href={telHref} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="w-3.5 h-3.5" />
              {config.phone}
            </a>
            {/* Ссылку на Telegram показываем только если username прошёл валидацию */}
            {config.telegram_username && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <a href={`https://t.me/${config.telegram_username}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <Send className="w-3.5 h-3.5" />
                  Telegram
                </a>
              </>
            )}
          </div>
          <a href={yandexMapsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
            <MapPin className="w-3.5 h-3.5" />
            {config.address}
          </a>
        </motion.div>
      </div>
    </div>
  )
}

export default memo(Screen1Hero)