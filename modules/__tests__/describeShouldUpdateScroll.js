import expect from 'expect'
import scrollLeft from 'dom-helpers/query/scrollLeft'
import scrollTop from 'dom-helpers/query/scrollTop'

import delay from './delay'
import { withRoutes } from './fixtures'
import run from './run'

export default function describeShouldUpdateScroll(withScroll, createHistory) {
  describe('shouldUpdateScroll', () => {
    let unlisten

    afterEach(done => {
      if (unlisten) {
        unlisten()
      }

      delay(done)
    })

    it('should allow scroll suppression', done => {
      const history = withRoutes(withScroll(
        createHistory(),
        (prevLocation, location) => (
          !prevLocation || prevLocation.pathname !== location.pathname
        )
      ))

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
      const history = withRoutes(withScroll(
        createHistory(), () => [ 10 , 20 ]
      ))

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

    it('should allow async transition', done => {
      let shouldUpdateCb = null
      const history = withRoutes(withScroll(
        createHistory(),
        (old, current, cb) => { shouldUpdateCb = cb }
      ))

      unlisten = run(history, [
        () => {
          history.push('/oldpath')
        },
        () => {
          history.push('/newpath')
        },
        () => {
          expect(scrollLeft(window)).toBe(0)
          expect(scrollTop(window)).toBe(0)
          shouldUpdateCb([ 10, 20 ])
          delay(() => {
            expect(scrollLeft(window)).toBe(10)
            expect(scrollTop(window)).toBe(20)
            done()
          })
        }
      ])
    })
  })
}
