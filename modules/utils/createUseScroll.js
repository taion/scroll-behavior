import scrollTo from './scrollTo'

export default function createUseScroll(
  getScrollPosition, start, stop, updateLocation
) {
  return function (createHistory) {
    return function (options = {}) {
      const { shouldUpdateScroll, ...historyOptions } = options

      const history = createHistory(historyOptions)

      let numListeners = 0

      function checkStart() {
        if (++numListeners === 1 && start) {
          start(history)
        }
      }

      function checkStop() {
        if (--numListeners === 0 && stop) {
          stop()
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

      let oldLocation
      let listeners = [], currentLocation, unlisten

      function onChange(location) {
        oldLocation = currentLocation
        currentLocation = location

        listeners.forEach(listener => listener(location))

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

        if (scrollPosition) {
          scrollTo(scrollPosition)
        }
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
