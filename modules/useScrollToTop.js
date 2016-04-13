import { POP } from 'history/lib/Actions'

import createUseScroll from './utils/createUseScroll'
import setScrollRestoration from './utils/setScrollRestoration'

/**
 * `useScrollToTop` scrolls to the top of the page after any transition.
 *
 * This is not fully reliable for `POP` transitions.
 */
export default function useScrollToTop(createHistory) {
  let unsetScrollRestoration

  function updateScroll({ action }, customPosition) {
    const [ x, y ] = customPosition || [ 0, 0 ]
    // If we didn't manage to disable the default scroll restoration, and it's
    // a pop transition for which the browser might restore scroll position,
    // then let the browser update to its remembered scroll position first,
    // before we set the actual correct scroll position.
    if (action === POP && !unsetScrollRestoration) {
      setTimeout(() => window.scrollTo(x, y))
      return
    }

    window.scrollTo(x, y)
  }

  function start() {
    // This helps avoid some jankiness in fighting against the browser's
    // default scroll behavior on `POP` transitions.
    unsetScrollRestoration = setScrollRestoration('manual')
  }

  function stop() {
    /* istanbul ignore if: not supported by any browsers on Travis */
    if (unsetScrollRestoration) {
      unsetScrollRestoration()
    }
  }

  return createUseScroll(updateScroll, start, stop)(createHistory)
}
