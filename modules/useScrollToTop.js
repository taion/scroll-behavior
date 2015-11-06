import scrollTo from './utils/scrollTo'

/**
 * `useScrollToTop` scrolls to the top of the page after any transition.
 *
 * This is not fully reliable for `POP` transitions.
 */
export default function useScrollToTop(createHistory) {
  return options => {
    const history = createHistory(options)

    history.listen(() => scrollTo(0, 0))

    return history
  }
}
