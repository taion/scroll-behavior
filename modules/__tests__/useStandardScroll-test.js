import expect from 'expect'
import scrollTop from 'dom-helpers/query/scrollTop'

import useStandardScroll from '../useStandardScroll'

import { HISTORIES } from './config'
import { useRoutes } from './fixtures'
import run from './run'

describe('useStandardScroll', () => {
  HISTORIES.forEach(createHistory => {
    describe(createHistory.name, () => {
      let history, unlisten

      beforeEach(() => {
        history = useRoutes(useStandardScroll(createHistory))()
      })

      afterEach(() => {
        if (unlisten) {
          unlisten()
        }
      })

      it('should scroll to top on PUSH', done => {
        unlisten = run(history, [
          () => {
            scrollTop(window, 15000)
            history.pushState(null, '/detail')
          },
          () => {
            expect(scrollTop(window)).toBe(0)
            done()
          }
        ])
      })

      it('should restore scroll on POP', done => {
        unlisten = run(history, [
          () => {
            scrollTop(window, 15000)

            // Delay this to let the scroll position actually save.
            requestAnimationFrame(() => setTimeout(() => {
              history.pushState(null, '/detail')
            }))
          },
          () => {
            history.goBack()
          },
          () => {
            expect(scrollTop(window)).toBe(15000)
            done()
          }
        ])
      })
    })
  })
})
