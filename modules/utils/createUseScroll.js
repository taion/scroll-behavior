import off from 'dom-helpers/events/off'
import on from 'dom-helpers/events/on'
import scrollLeft from 'dom-helpers/query/scrollLeft'
import scrollTop from 'dom-helpers/query/scrollTop'
import requestAnimationFrame from 'dom-helpers/util/requestAnimationFrame'

// Try at most this many times to scroll, to avoid getting stuck.
const MAX_SCROLL_ATTEMPTS = 2

export default function createUseScroll(
  getScrollPosition, start, stop, updateLocation
) {
  return function (createHistory) {
    return function (options = {}) {
      const { shouldUpdateScroll, ...historyOptions } = options

      const history = createHistory(historyOptions)

      let scrollTarget
      let numScrollAttempts
      let checkScrollHandle

      function cancelCheckScroll() {
        if (checkScrollHandle !== null) {
          requestAnimationFrame.cancel(checkScrollHandle)
          checkScrollHandle = null
        }
      }

      function onScroll() {
        if (!scrollTarget) {
          return
        }

        const [ xTarget, yTarget ] = scrollTarget
        const x = scrollLeft(window)
        const y = scrollTop(window)

        if (x === xTarget && y === yTarget) {
          scrollTarget = null
          cancelCheckScroll()
        }
      }

      // FIXME: This is not the right way to track whether there are listeners.
      let numListeners = 0

      function checkStart() {
        if (numListeners === 0) {
          if (start) {
            start(history)
          }

          scrollTarget = null
          numScrollAttempts = 0
          checkScrollHandle = null

          on(window, 'scroll', onScroll)
        }

        ++numListeners
      }

      function checkStop() {
        --numListeners

        if (numListeners === 0) {
          if (stop) {
            stop()
          }

          off(window, 'scroll', onScroll)

          cancelCheckScroll()
        }
      }

      function listenBefore(hook) {
        checkStart()
        const unlisten = history.listenBefore(hook)

        return function () {
          unlisten()
          checkStop()
        }
      }

      function checkScrollPosition() {
        checkScrollHandle = null

        // We can only get here if scrollTarget is set. Every code path that
        // unsets scroll target also cancels the handle to avoid calling this
        // handler. Still, check anyway just in case.
        /* istanbul ignore if: paranoid guard */
        if (!scrollTarget) {
          return
        }

        const [ x, y ] = scrollTarget
        window.scrollTo(x, y)

        ++numScrollAttempts

        /* istanbul ignore if: paranoid guard */
        if (numScrollAttempts >= MAX_SCROLL_ATTEMPTS) {
          scrollTarget = null
          return
        }

        checkScrollHandle = requestAnimationFrame(checkScrollPosition)
      }

      let oldLocation
      let listeners = [], currentLocation, unlisten

      function onChange(location) {
        oldLocation = currentLocation
        currentLocation = location

        listeners.forEach(listener => listener(location))

        // Whatever we were doing before isn't relevant any more.
        cancelCheckScroll()

        // useStandardScroll needs the new location even when not updating the
        // scroll position, to update the current key.
        if (updateLocation) {
          updateLocation(location)
        }

        let scrollPosition
        if (shouldUpdateScroll) {
          scrollPosition = shouldUpdateScroll(oldLocation, currentLocation)
        } else {
          scrollPosition = true
        }

        if (scrollPosition && !Array.isArray(scrollPosition)) {
          scrollPosition = getScrollPosition(currentLocation)
        }

        scrollTarget = scrollPosition

        // Check the scroll position to see if we even need to scroll.
        onScroll()
        if (!scrollTarget) {
          return
        }

        numScrollAttempts = 0
        checkScrollPosition()
      }

      function listen(listener) {
        checkStart()

        if (listeners.length === 0) {
          unlisten = history.listen(onChange)
        }

        // Add the listener to the list afterward so we can manage calling it
        // initially with the current location.
        listeners.push(listener)
        listener(currentLocation)

        return function () {
          listeners = listeners.filter(item => item !== listener)
          if (listeners.length === 0) {
            unlisten()
          }

          checkStop()
        }
      }

      return {
        ...history,
        listenBefore,
        listen
      }
    }
  }
}
