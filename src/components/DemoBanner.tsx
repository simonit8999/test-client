import { memo } from 'react'

interface Props {
  readonly businessName: string
  readonly onOpenOwnerCabinet: () => void
}

// backdrop-blur-md убран (дорогой эффект поверх всей страницы) — заменён
// чуть более плотным фоном, визуально почти неотличимо.
//
// Баннер — обычный блок в flex-колонке App (не absolute!): так он занимает
// собственную высоту и не накрывает шапку, прогресс-бар и контент экранов.
function DemoBanner({ businessName, onOpenOwnerCabinet }: Props) {
  return (
    <div className="shrink-0 px-4 safe-top">
      <div className="mt-3 rounded-2xl bg-white/15 border border-white/15 px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-accent font-bold">
            Демо-версия
          </div>
          <div className="text-[13px] font-medium truncate text-white">
            Так будут видеть сайт клиенты «{businessName}»
          </div>
        </div>
        <button
          onClick={onOpenOwnerCabinet}
          className="shrink-0 h-9 px-4 rounded-full bg-accent text-ink text-[13px] font-bold active:scale-95 transition-transform"
        >
          Кабинет
        </button>
      </div>
    </div>
  )
}

export default memo(DemoBanner)