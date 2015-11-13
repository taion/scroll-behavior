export default function createUseScroll(updateScroll, start, stop) {
  return function (createHistory) {
    return function (options) {
      const history = createHistory(options)

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

      let listeners = [], currentLocation, unlisten

      function onChange(location) {
        currentLocation = location

        listeners.forEach(listener => listener(location))
        updateScroll(location)
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
