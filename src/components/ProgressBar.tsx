import { memo } from 'react'
import { m as motion, useReducedMotion } from '../motion'

interface Props {
  readonly step: number // 1..4
  readonly total?: number
}

// memo: прогресс-бар не зависит от booking, поэтому не должен ре-рендериться
// при вводе в форму. Анимируем scaleX вместо width: transform композитится
// на GPU, width вызывает layout + paint на каждом кадре spring-анимации.
function ProgressBar({ step, total = 4 }: Props) {
  const reduce = useReducedMotion()

  return (
    <div className="px-5 pt-4 pb-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-[0.18em] text-zincsoft font-medium">
          Шаг {step} из {total}
        </span>
        <span className="text-[11px] uppercase tracking-[0.18em] text-accent font-semibold">
          {Math.round((step / total) * 100)}%
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full w-full rounded-full bg-accent shadow-glow"
          initial={false}
          animate={{ scaleX: step / total }}
          style={{ transformOrigin: 'left center' }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 140, damping: 22 }}
        />
      </div>
    </div>
  )
}

export default memo(ProgressBar)