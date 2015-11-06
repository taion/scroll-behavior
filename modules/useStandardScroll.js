import off from 'dom-helpers/events/off'
import on from 'dom-helpers/events/on'
import scrollLeft from 'dom-helpers/query/scrollLeft'
import scrollTop from 'dom-helpers/query/scrollTop'
import requestAnimationFrame from 'dom-helpers/util/requestAnimationFrame'
import { readState, saveState } from 'history/lib/DOMStateStorage'

import createUseScroll from './utils/createUseScroll'
import scrollTo from './utils/scrollTo'

/**
 * `useStandardScroll` attempts to imitate native browser scroll behavior by
 * recording updates to the window scroll position, then restoring the previous
 * scroll position upon a `POP` transition.
 */
export default function useStandardScroll(createHistory) {
  let unlistenScroll, unlistenBefore, unlisten

  function start(history) {
    // Don't override the browser's scroll behavior here - it helps avoid a
    // little bit of jank when the browser actually does do the right thing
    // after a `POP` transition.

    let currentKey
    let savePositionHandle = null

    // We have to listen to each scroll update rather than to just location
    // updates, because some browsers will update scroll position before
    // emitting the location change.
    function onScroll() {
      if (savePositionHandle !== null) {
        return
      }

      // It's possible that this scroll operation was triggered by what will be
      // a `POP` transition. Instead of updating the saved location
      // immediately, we have to enqueue the update, then potentially cancel it
      // if we observe a location update.
      savePositionHandle = requestAnimationFrame(() => {
        savePositionHandle = null

        if (!currentKey) {
          return
        }

        const state = readState(currentKey)
        const scrollPosition = [ scrollLeft(window), scrollTop(window) ]

        // We have to directly update `DOMStateStorage`, because actually
        // updating the location could cause e.g. React Router to re-render the
        // entire page, which would lead to observably bad scroll performance.
        saveState(currentKey, { ...state, scrollPosition })
      })
    }

    on(window, 'scroll', onScroll)
    unlistenScroll = () => off(window, 'scroll', onScroll)

    unlistenBefore = history.listenBefore(() => {
      if (savePositionHandle !== null) {
        requestAnimationFrame.cancel(savePositionHandle)
        savePositionHandle = null
      }
    })

    function getScrollPosition() {
      const state = readState(currentKey)
      if (!state) {
        return null
      }

      return state.scrollPosition
    }

    unlisten = history.listen(({ key }) => {
      currentKey = key

      const scrollPosition = getScrollPosition() || [ 0, 0 ]
      scrollTo(...scrollPosition)
    })
  }

  function stop() {
    unlistenScroll()
    unlistenBefore()
    unlisten()
  }

  return createUseScroll(start, stop)(createHistory)
}
