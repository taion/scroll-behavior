import expect from 'expect'
import scrollTop from 'dom-helpers/query/scrollTop'

import useSimpleScroll from '../useSimpleScroll'

import { HISTORIES } from './config'
import { useRoutes } from './fixtures'
import run from './run'

describe('useSimpleScroll', () => {
  HISTORIES.forEach(createHistory => {
    describe(createHistory.name, () => {
      let history, unlisten

      beforeEach(() => {
        history = useRoutes(useSimpleScroll(createHistory))()
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

      it('should not scroll to top on POP', done => {
        unlisten = run(history, [
          () => {
            scrollTop(window, 15000)
            history.pushState(null, '/detail')
          },
          () => {
            history.goBack()
          },
          () => {
            expect(scrollTop(window)).toNotBe(0)
            done()
          }
        ])
      })

      it('should allow scroll suppression', done => {
        history = useRoutes(useSimpleScroll(createHistory))({
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
