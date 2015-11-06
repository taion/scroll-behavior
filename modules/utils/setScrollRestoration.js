export default function setScrollRestoration(scrollRestoration) {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = scrollRestoration
  }
}
