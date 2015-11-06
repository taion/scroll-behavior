export default function createUseScroll(start, stop) {
  return function (createHistory) {
    return function (options) {
      const history = createHistory(options)

      let numListeners = 0

      function wrap(listen) {
        return function (listener) {
          if (++numListeners === 1) {
            start(history)
          }

          const unlisten = listen(listener)

          return function () {
            unlisten()

            if (--numListeners === 0) {
              stop()
            }
          }
        }
      }

      return {
        ...history,
        listen: wrap(history.listen),
        listenBefore: wrap(history.listenBefore)
      }
    }
  }
}
