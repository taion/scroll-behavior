import expect from 'expect'
import scrollTop from 'dom-helpers/query/scrollTop'

import withSimpleScroll from '../withSimpleScroll'

import { HISTORIES } from './config'
import delay from './delay'
import describeShouldUpdateScroll from './describeShouldUpdateScroll'
import { withRoutes } from './fixtures'
import run from './run'

describe('withSimpleScroll', () => {
  HISTORIES.forEach(createHistory => {
    describe(createHistory.name, () => {
      let history, unlisten

      beforeEach(() => {
        history = withRoutes(withSimpleScroll(createHistory()))
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

      it('should not scroll to top on POP', done => {
        unlisten = run(history, [
          () => {
            scrollTop(window, 15000)
            delay(() => history.push('/detail'))
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

      describeShouldUpdateScroll(withSimpleScroll, createHistory)
    })
  })
})
