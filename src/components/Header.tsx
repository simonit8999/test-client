import { memo } from 'react'
import { ChevronLeft } from 'lucide-react'

interface Props {
  readonly title: string
  readonly onBack: () => void
}

// memo: Header ре-рендерится только при смене заголовка, а не при каждом
// обновлении booking (например, при вводе текста в форме).
// backdrop-blur-xl убран: sticky-элемент с блюром пересобирался при каждом
// скролле — одна из самых дорогих операций на мобильных GPU. Плотный bg-ink/95
// визуально эквивалентен над тёмным контентом.
function Header({ title, onBack }: Props) {
  return (
    <header className="safe-top sticky top-0 z-30">
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 bg-ink/95 border-b border-white/[0.06]">
        <button
          onClick={onBack}
          aria-label="Назад"
          className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition active:scale-[0.92]"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2.2} />
        </button>
        <h2 className="font-display font-bold text-[15px] tracking-tight text-white/90 uppercase">
          {title}
        </h2>
      </div>
    </header>
  )
}

export default memo(Header)