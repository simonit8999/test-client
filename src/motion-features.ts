import { domAnimation } from 'framer-motion'

/**
 * Отдельный модуль только ради фич анимаций.
 *
 * Импорт должен быть ИМЕНОВАННЫМ и лежать в отдельном файле: если писать
 * `import('framer-motion').then(m => m.domAnimation)`, это namespace-импорт —
 * tree-shaking не срабатывает и в асинхронный чанк попадает вся библиотека
 * вместе с полным `motion` (124 КБ вместо ~61 КБ).
 */
export default domAnimation
