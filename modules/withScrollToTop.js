import { POP } from 'history/lib/Actions'

import setScrollRestoration from './utils/setScrollRestoration'
import withScroll from './utils/withScroll'

/**
 * `withScrollToTop` scrolls to the top of the page after any transition.
 *
 * This is not fully reliable for `POP` transitions.
 */
export default function withScrollToTop(history, shouldUpdateScroll) {
  let unsetScrollRestoration

  function getScrollPosition({ action }) {
    // If we didn't manage to disable the default scroll restoration, and it's
    // a pop transition for which the browser might restore scroll position,
    // then let the browser update to its remembered scroll position first,
    // before we set the actual correct scroll position.
    if (action === POP && !unsetScrollRestoration) {
      setTimeout(() => window.scrollTo(0, 0))
      return null
    }

    return [ 0, 0 ]
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

  return withScroll(
    history,
    shouldUpdateScroll,
    { getScrollPosition, start, stop }
  )
}
