export default function scrollTo(x, y) {
  // Need to defer this to after other listeners fire in case some of them
  // update the page.
  setTimeout(() => window.scrollTo(x, y))
}
