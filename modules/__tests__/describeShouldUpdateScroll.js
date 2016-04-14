import expect from 'expect'
import scrollLeft from 'dom-helpers/query/scrollLeft'
import scrollTop from 'dom-helpers/query/scrollTop'

import delay from './delay'
import { useRoutes } from './fixtures'
import run from './run'

export default function describeShouldUpdateScroll(useScroll, createHistory) {
  describe('shouldUpdateScroll', () => {
    let unlisten

    afterEach(done => {
      if (unlisten) {
        unlisten()
      }

      delay(done)
    })

    it('should allow scroll suppression', done => {
      // We intentially invert the order of history enhancers here so the
      // actual useScroll enhancer can consume shouldUpdateScroll, instead of
      // the fake one in our useRoutes.
      const history = useScroll(useRoutes(createHistory))({
        shouldUpdateScroll: (oldLoc, newLoc) => (
          !oldLoc || oldLoc.pathname !== newLoc.pathname
        )
      })

      unlisten = run(history, [
        () => {
          history.push('/oldpath')
        },
        () => {
          scrollTop(window, 5000)
          delay(() => history.push({
            pathname: '/oldpath', query: { key: 'value' }
          }))
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

    it('should allow custom position', done => {
      const history = useScroll(useRoutes(createHistory))({
        shouldUpdateScroll: () => (
          [ 10 , 20 ]
        )
      })

      unlisten = run(history, [
        () => {
          history.push('/oldpath')
        },
        () => {
          history.push('/newpath')
        },
        () => {
          expect(scrollLeft(window)).toBe(10)
          expect(scrollTop(window)).toBe(20)
          done()
        }
      ])
    })
  })
}
