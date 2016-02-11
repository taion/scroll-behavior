import expect from 'expect'
import scrollTop from 'dom-helpers/query/scrollTop'

import useScrollToTop from '../useScrollToTop'

import { HISTORIES } from './config'
import { useRoutes } from './fixtures'
import run from './run'

describe('useScrollToTop', () => {
  HISTORIES.forEach(createHistory => {
    describe(createHistory.name, () => {
      let history, unlisten

      beforeEach(() => {
        history = useRoutes(useScrollToTop(createHistory))()
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

      it('should scroll to top on POP', done => {
        unlisten = run(history, [
          () => {
            scrollTop(window, 15000)
            history.pushState(null, '/detail')
          },
          () => {
            history.goBack()
          },
          () => {
            expect(scrollTop(window)).toBe(0)
            done()
          }
        ])
      })

      it('should allow scroll suppression', done => {
        history = useRoutes(useScrollToTop(createHistory))({
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
