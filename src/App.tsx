import { useCallback, useState } from 'react'
import { AnimatePresence, MotionProvider, m as motion, useReducedMotion, type Variants } from './motion'
import { useConfig } from './hooks/useConfig'
import Header from './components/Header'
import ProgressBar from './components/ProgressBar'
import DemoBanner from './components/DemoBanner'
import OwnerCabinet from './screens/OwnerCabinet'
import Screen1Hero from './screens/Screen1Hero'
import Screen2Service from './screens/Screen2Service'
import Screen3Details from './screens/Screen3Details'
import Screen4Time from './screens/Screen4Time'
import Screen5Confirm from './screens/Screen5Confirm'
import type { BookingData, Direction, ISODateString, Service, Step, TimeString, ViewMode } from './types'

const initialBooking: BookingData = { service: null, carModel: '', plate: '', name: '', phone: '', comment: '', date: null, time: null }
const HEADER_TITLES: Record<Step, string> = { 0: '', 1: 'Услуга', 2: 'Данные', 3: 'Время', 4: 'Подтверждение' }

// Полноценные пружинные переходы между экранами (трансформация + прозрачность).
const screenVariants: Variants = {
  enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-30%', opacity: direction > 0 ? 1 : 0 }),
  center: { x: 0, opacity: 1, zIndex: 1, transition: { type: 'spring', stiffness: 400, damping: 35 } },
  exit: (direction: number) => ({ x: direction > 0 ? '-30%' : '100%', opacity: direction > 0 ? 0 : 1, zIndex: 0, transition: { type: 'spring', stiffness: 400, damping: 35 } }),
}

// Упрощённый вариант для prefers-reduced-motion: только короткое затухание,
// без пружин и трансформаций (CSS-медиазапрос на JS-анимации framer не влияет).
const reducedVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, zIndex: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, zIndex: 0, transition: { duration: 0.15 } },
}

export default function App() {
  const { config, error } = useConfig()
  const [step, setStep] = useState<Step>(0)
  const [direction, setDirection] = useState<Direction>(1)
  const [booking, setBooking] = useState<BookingData>(initialBooking)
  const [viewMode, setViewMode] = useState<ViewMode>('booking')
  const reduceMotion = useReducedMotion()

  // Все хуки — ДО условных return, иначе нарушится порядок вызовов хуков.

  // Стабильные колбэки: не пересоздаются на каждом рендере, поэтому
  // memo-компоненты (Header, ProgressBar, экраны) не ре-рендерятся лишний раз,
  // в том числе при наборе текста в форме (шаг 2).
  const update = useCallback((patch: Partial<BookingData>) => setBooking((b) => ({ ...b, ...patch })), [])
  const selectService = useCallback((s: Service) => update({ service: s }), [update])
  const goNext = useCallback(() => { setDirection(1); setStep((s) => (s < 4 ? ((s + 1) as Step) : s)) }, [])
  const goBack = useCallback(() => { setDirection(-1); setStep((s) => (s > 0 ? ((s - 1) as Step) : s)) }, [])
  const startBooking = useCallback(() => { setDirection(1); setStep(1) }, [])
  const openOwnerCabinet = useCallback(() => setViewMode('owner'), [])
  const closeOwnerCabinet = useCallback(() => setViewMode('booking'), [])
  // При смене даты сбрасываем выбранное время (раньше делалось через onTime(''))
  const setDate = useCallback((d: ISODateString) => update({ date: d, time: null }), [update])
  const setTime = useCallback((t: TimeString) => update({ time: t }), [update])

  if (error) return <div className="text-white p-5 bg-ink min-h-screen">Ошибка загрузки конфига: {error}</div>
  if (!config) return <div className="text-white p-5 bg-ink min-h-screen">Загрузка...</div>

  const variants = reduceMotion ? reducedVariants : screenVariants
  const showDemoBanner = Boolean(config.isDemo) && viewMode === 'booking'

  return (
    <MotionProvider>
      {/* flex-col: баннер занимает свою строку, а контент — оставшуюся высоту
          (раньше баннер был absolute поверх контента и накладывался на шапку). */}
      <div className="relative w-full h-[100dvh] overflow-hidden bg-ink text-white flex flex-col">
        {/* Показываем баннер только в демо и только в режиме записи */}
        {showDemoBanner && (
          <DemoBanner businessName={config.business_name} onOpenOwnerCabinet={openOwnerCabinet} />
        )}

        {/* [--safe-top:0px] — баннер уже учёл safe-area сверху, второй раз не надо */}
        <div className={`relative flex-1 min-h-0${showDemoBanner ? ' [--safe-top:0px]' : ''}`}>
          <AnimatePresence mode="wait">
            {viewMode === 'owner' ? (
              <OwnerCabinet key="owner" config={config} onBack={closeOwnerCabinet} />
            ) : (
              <div key="booking-flow" className="w-full h-full">
                <AnimatePresence initial={false} custom={direction}>
                  {step === 0 && (
                    <motion.div key="hero" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" className="absolute inset-0 bg-ink">
                      <Screen1Hero config={config} onStart={startBooking} />
                    </motion.div>
                  )}
                  {step !== 0 && (
                    <motion.div key={step} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" className="absolute inset-0 w-full h-full flex flex-col bg-ink origin-left">
                      <Header title={HEADER_TITLES[step]} onBack={goBack} />
                      <ProgressBar step={step} total={4} />
                      <div className="relative flex-1 overflow-hidden">
                        {step === 1 && <Screen2Service config={config} selected={booking.service} onSelect={selectService} onNext={goNext} />}
                        {step === 2 && <Screen3Details data={booking} onChange={update} onNext={goNext} />}
                        {step === 3 && <Screen4Time config={config} date={booking.date} time={booking.time} onDate={setDate} onTime={setTime} onNext={goNext} />}
                        {step === 4 && <Screen5Confirm config={config} data={booking} />}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MotionProvider>
  )
}