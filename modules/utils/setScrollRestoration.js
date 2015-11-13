export default function setScrollRestoration(scrollRestoration) {
  /* istanbul ignore if: not supported by any browsers on Travis */
  if ('scrollRestoration' in window.history) {
    const oldScrollRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = scrollRestoration

    return function () {
      window.history.scrollRestoration = oldScrollRestoration
    }
  }

  return null
}
