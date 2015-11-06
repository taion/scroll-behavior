import createUseScroll from './utils/createUseScroll'
import scrollTo from './utils/scrollTo'
import setScrollRestoration from './utils/setScrollRestoration'

/**
 * `useScrollToTop` scrolls to the top of the page after any transition.
 *
 * This is not fully reliable for `POP` transitions.
 */
export default function useScrollToTop(createHistory) {
  let unsetScrollRestoration, unlisten

  function start(history) {
    // This helps avoid some jankiness in fighting against the browser's
    // default scroll behavior on `POP` transitions.
    unsetScrollRestoration = setScrollRestoration('manual')

    unlisten = history.listen(() => scrollTo(0, 0))
  }

  function stop() {
    unsetScrollRestoration()
    unlisten()
  }

  return createUseScroll(start, stop)(createHistory)
}
