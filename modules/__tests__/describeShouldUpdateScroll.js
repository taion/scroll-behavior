import expect from 'expect'
import scrollTop from 'dom-helpers/query/scrollTop'

import { useRoutes } from './fixtures'
import run from './run'

export default function describeShouldUpdateScroll(useScroll, createHistory) {
  describe('shouldUpdateScroll', () => {
    let history, unlisten

    beforeEach(() => {
      // We intentially invert the order of history enhancers here so the
      // actual useScroll enhancer can consume shouldUpdateScroll.
      history = useScroll(useRoutes(createHistory))({
        shouldUpdateScroll: (oldLoc, newLoc) => (
          !oldLoc || oldLoc.pathname !== newLoc.pathname
        )
      })
    })

    afterEach(() => {
      if (unlisten) {
        unlisten()
      }
    })

    it('should allow scroll suppression', done => {
      unlisten = run(history, [
        () => {
          history.push('/oldpath')
        },
        () => {
          scrollTop(window, 5000)
          history.push({ pathname: '/oldpath', query: { key: 'value' } })
        },
        () => {
          expect(scrollTop(window)).toBe(5000)
          history.push('/newpath')
        },
        () => {
          expect(scrollTop(window)).toBe(0)
          done()
        }
      ])
    })
  })
}
