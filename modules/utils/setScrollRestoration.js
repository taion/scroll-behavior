export default function setScrollRestoration(scrollRestoration) {
  if (!('scrollRestoration' in window.history)) {
    return function () {}
  }

  const oldScrollRestoration = window.history.scrollRestoration
  window.history.scrollRestoration = scrollRestoration

  return function () {
    window.history.scrollRestoration = oldScrollRestoration
  }
}
