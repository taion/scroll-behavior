import expect from 'expect'
import scrollTop from 'dom-helpers/query/scrollTop'

import useSimpleScroll from '../useSimpleScroll'

import { HISTORIES } from './config'
import delay from './delay'
import describeShouldUpdateScroll from './describeShouldUpdateScroll'
import { useRoutes } from './fixtures'
import run from './run'

describe('useSimpleScroll', () => {
  HISTORIES.forEach(createHistory => {
    describe(createHistory.name, () => {
      let history, unlisten

      beforeEach(() => {
        history = useRoutes(useSimpleScroll(createHistory))()
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

      describeShouldUpdateScroll(useSimpleScroll, createHistory)
    })
  })
})
