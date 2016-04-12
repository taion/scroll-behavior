import off from 'dom-helpers/events/off'
import on from 'dom-helpers/events/on'
import scrollLeft from 'dom-helpers/query/scrollLeft'
import scrollTop from 'dom-helpers/query/scrollTop'
import scrollTo from './utils/scrollTo'
import { readState, saveState } from 'history/lib/DOMStateStorage'

import createUseScroll from './utils/createUseScroll'
import setScrollRestoration from './utils/setScrollRestoration'

/**
 * `useStandardScroll` attempts to imitate native browser scroll behavior by
 * recording updates to the window scroll position, then restoring the previous
 * scroll position upon a `POP` transition.
 */
export default function useStandardScroll(createHistory) {
  const positionByPath = {}
  let currentKey
  let previousPath
  let currentPath

  function getScrollPosition() {
    const state = readState(currentKey)
    const positionFromPath = state && state.restoreScroll && positionByPath[currentPath]
    const positionFromState = state && state.scrollPosition
    const defaultPosition = [0, 0]
    if (previousPath === currentPath) {
      // Scroll to top if you navigate to the route you are already on
      return defaultPosition
    } else {
      return positionFromPath || positionFromState || defaultPosition
    }
  }

  // `history` will invoke this listener synchronously, so `currentKey` will
  // always be defined.
  function updateLocation(location) {
    previousPath = currentPath
    currentPath = location.pathname
    currentKey = location.key
  }

  function updateScroll() {
    const scrollPosition = getScrollPosition()
    if (scrollPosition) {
      positionByPath[currentPath] = scrollPosition
      const [ x, y ] = scrollPosition
      scrollTo(x, y)
    }
  }

  let unsetScrollRestoration, unlistenScroll, unlistenBefore

  function start(history) {
    // This helps avoid some jankiness in fighting against the browser's
    // default scroll behavior on `POP` transitions.
    unsetScrollRestoration = setScrollRestoration('manual')

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

        const state = readState(currentKey)
        const scrollPosition = [ scrollLeft(window), scrollTop(window) ]

        // We have to directly update `DOMStateStorage`, because actually
        // updating the location could cause e.g. React Router to re-render the
        // entire page, which would lead to observably bad scroll performance.
        saveState(currentKey, { ...state, scrollPosition })
        positionByPath[currentPath] = scrollPosition
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
  }

  function stop() {
    /* istanbul ignore if: not supported by any browsers on Travis */
    if (unsetScrollRestoration) {
      unsetScrollRestoration()
    }

    unlistenScroll()
    unlistenBefore()
  }

  return createUseScroll(
    updateScroll, start, stop, updateLocation
  )(createHistory)
}
