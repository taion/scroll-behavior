import requestAnimationFrame from 'dom-helpers/util/requestAnimationFrame'

export default function scrollTo(x,y) {
  requestAnimationFrame(() => {
    window.scrollTo(x, y)
  })
}