import expect from 'expect'
import scrollTop from 'dom-helpers/query/scrollTop'

import withScrollToTop from '../withScrollToTop'

import { HISTORIES } from './config'
import delay from './delay'
import describeShouldUpdateScroll from './describeShouldUpdateScroll'
import { withRoutes } from './fixtures'
import run from './run'

describe('withScrollToTop', () => {
  HISTORIES.forEach(createHistory => {
    describe(createHistory.name, () => {
      let history, unlisten

      beforeEach(() => {
        history = withRoutes(withScrollToTop(createHistory()))
      })

      afterEach(done => {
        if (unlisten) {
          unlisten()
        }

        delay(done)
      })

      it('should scroll to top on PUSH', done => {
        unlisten = run(history, [
          () => {
            scrollTop(window, 15000)
            delay(() => history.push('/detail'))
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
            delay(() => history.push('/detail'))
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

      describeShouldUpdateScroll(withScrollToTop, createHistory)
    })
  })
})
