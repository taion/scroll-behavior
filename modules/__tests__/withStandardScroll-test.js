import expect from 'expect'
import scrollTop from 'dom-helpers/query/scrollTop'

import withStandardScroll from '../withStandardScroll'

import { HISTORIES } from './config'
import delay from './delay'
import describeShouldUpdateScroll from './describeShouldUpdateScroll'
import { withRoutes } from './fixtures'
import run from './run'

describe('withStandardScroll', () => {
  HISTORIES.forEach(createHistory => {
    describe(createHistory.name, () => {
      let history, listenBeforeSpy, unlistenBefore, unlisten

      beforeEach(() => {
        history = withRoutes(withStandardScroll(createHistory()))

        listenBeforeSpy = expect.createSpy()
        unlistenBefore = history.listenBefore(listenBeforeSpy)
      })

      afterEach(done => {
        if (unlisten) {
          unlisten()
        }
        if (unlistenBefore) {
          unlistenBefore()
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
            expect(listenBeforeSpy.calls.length).toBe(1)
            expect(scrollTop(window)).toBe(0)
            done()
          }
        ])
      })

      it('should restore scroll on POP', done => {
        unlisten = run(history, [
          () => {
            // This will be ignored, but will exercise the throttle logic.
            scrollTop(window, 10000)

            setTimeout(() => {
              scrollTop(window, 15000)
              delay(() => history.push('/detail'))
            })
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

      describeShouldUpdateScroll(withStandardScroll, createHistory)
    })
  })
})
