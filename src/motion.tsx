import { LazyMotion, AnimatePresence, m, useReducedMotion } from 'framer-motion'
import type { PropsWithChildren } from 'react'

/**
 * Точка входа для анимаций.
 *
 * Зачем: полный `motion` из framer-motion тянет в основной бандл все DOM-фичи
 * (~115 КБ raw / ~39 КБ gzip). Здесь используется `m` — лёгкий компонент без
 * фич, а сами фичи (domAnimation) грузятся отдельным чанком сразу после
 * первого рендера (~61 КБ raw / ~22 КБ gzip). Экономия основного бандла
 * ~97 КБ raw / ~32 КБ gzip без изменения анимаций.
 *
 * `strict` запрещает использовать полный `motion` — иначе фичи снова попадут
 * в основной чанк. Импортируйте `m as motion` из этого модуля.
 */
export { m, AnimatePresence, useReducedMotion }
export type { Variants } from 'framer-motion'

const loadFeatures = () => import('./motion-features').then((mod) => mod.default)

export function MotionProvider({ children }: PropsWithChildren) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  )
}
