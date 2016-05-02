import withScroll from '../utils/withScroll'

export function withRoutes(history) {
  let element

  function getScrollPosition({ pathname }) {
    if (pathname === '/') {
      element.style.height = '20000px'
      element.style.width = '20000px'
    } else {
      element.style.height = '10000px'
      element.style.width = '10000px'
    }

    // Force reflow.
    element.offsetHeight
  }

  function start() {
    element = document.createElement('div')
    document.body.appendChild(element)
  }

  function stop() {
    document.body.removeChild(element)
  }

  return withScroll(history, null, { getScrollPosition, start, stop })
}
