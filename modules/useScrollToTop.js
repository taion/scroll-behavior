import scrollTo from './utils/scrollTo'
import setScrollRestoration from './utils/setScrollRestoration'

/**
 * `useScrollToTop` scrolls to the top of the page after any transition.
 *
 * This is not fully reliable for `POP` transitions.
 */
export default function useScrollToTop(createHistory) {
  return options => {
    const history = createHistory(options)

    // This helps avoid some jankiness in fighting against the browser's
    // default scroll behavior on `POP` transitions.
    setScrollRestoration('manual')

    history.listen(() => scrollTo(0, 0))

    return history
  }
}
