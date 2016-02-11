import expect from 'expect'
import scrollTop from 'dom-helpers/query/scrollTop'

import useStandardScroll from '../useStandardScroll'

import { HISTORIES } from './config'
import { useRoutes } from './fixtures'
import run from './run'

describe('useStandardScroll', () => {
  HISTORIES.forEach(createHistory => {
    describe(createHistory.name, () => {
      let history, listenBeforeSpy, unlistenBefore, unlisten

      beforeEach(() => {
        history = useRoutes(useStandardScroll(createHistory))()

        listenBeforeSpy = expect.createSpy()
        unlistenBefore = history.listenBefore(listenBeforeSpy)
      })

      afterEach(() => {
        if (unlisten) {
          unlisten()
        }
        if (unlistenBefore) {
          unlistenBefore()
        }
      })

      it('should scroll to top on PUSH', done => {
        unlisten = run(history, [
          () => {
            scrollTop(window, 15000)
            history.pushState(null, '/detail')
          },
          () => {
            expect(listenBeforeSpy.calls.length).toBe(1)
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
            expect(listenBeforeSpy.calls.length).toBe(1)
            history.goBack()
          },
          () => {
            expect(listenBeforeSpy.calls.length).toBe(2)
            expect(scrollTop(window)).toBe(15000)
            done()
          }
        ])
      })

      it('should allow scroll suppression', done => {
        history = useRoutes(useStandardScroll(createHistory))({
          shouldUpdateScroll: (oldLoc, newLoc) =>
            !oldLoc || oldLoc.pathname !== newLoc.pathname
        })
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
  })
})
