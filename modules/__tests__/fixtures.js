import createUseScroll from '../utils/createUseScroll'

export function useRoutes(createHistory) {
  let element, unlisten

  function start(history) {
    element = document.createElement('div')
    document.body.appendChild(element)

    unlisten = history.listen(({ pathname }) => {
      if (pathname === '/') {
        element.style.height = '20000px'
      } else {
        element.style.height = '10000px'
      }

      // Force reflow.
      element.offsetHeight
    })
  }

  function stop() {
    document.body.removeChild(element)
    unlisten()
  }

  return createUseScroll(start, stop)(createHistory)
}
