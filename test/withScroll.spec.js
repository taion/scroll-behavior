import { expect } from 'chai';
import scrollLeft from 'dom-helpers/query/scrollLeft';
import scrollTop from 'dom-helpers/query/scrollTop';
import createBrowserHistory from 'history/lib/createBrowserHistory';
import createHashHistory from 'history/lib/createHashHistory';

import withScroll from '../src';

import { withRoutes } from './fixtures';
import run, { delay } from './run';

describe('withStandardScroll', () => {
  [
    createBrowserHistory,
    createHashHistory,
  ].forEach(createHistory => {
    describe(createHistory.name, () => {
      let unlisten;

      afterEach(done => {
        if (unlisten) {
          unlisten();
        }

        delay(done);
      });

      describe('default behavior', () => {
        let history;

        beforeEach(() => {
          history = withRoutes(withScroll(createHistory()));
        });

        it('should scroll to top on PUSH', done => {
          unlisten = run(history, [
            () => {
              scrollTop(window, 15000);
              delay(() => history.push('/detail'));
            },
            () => {
              expect(scrollTop(window)).to.equal(0);
              done();
            },
          ]);
        });

        it('should restore scroll on POP', done => {
          unlisten = run(history, [
            () => {
              // This will be ignored, but will exercise the throttle logic.
              scrollTop(window, 10000);

              setTimeout(() => {
                scrollTop(window, 15000);
                delay(() => history.push('/detail'));
              });
            },
            () => {
              history.goBack();
            },
            () => {
              expect(scrollTop(window)).to.equal(15000);
              done();
            },
          ]);
        });
      });

      describe('custom behavior', () => {
        it('should allow scroll suppression', done => {
          const history = withRoutes(withScroll(
            createHistory(),
            (prevLocation, location) => (
              !prevLocation || prevLocation.pathname !== location.pathname
            )
          ));

          unlisten = run(history, [
            () => {
              history.push('/oldpath');
            },
            () => {
              scrollTop(window, 5000);
              delay(() => history.push('/oldpath?key=value'));
            },
            () => {
              expect(scrollTop(window)).to.equal(5000);
              history.push('/newpath');
            },
            () => {
              expect(scrollTop(window)).to.equal(0);
              done();
            },
          ]);
        });

        it('should allow custom position', done => {
          const history = withRoutes(withScroll(
            createHistory(), () => [10, 20]
          ));

          unlisten = run(history, [
            () => {
              history.push('/oldpath');
            },
            () => {
              history.push('/newpath');
            },
            () => {
              expect(scrollLeft(window)).to.equal(10);
              expect(scrollTop(window)).to.equal(20);
              done();
            },
          ]);
        });
      });
    });
  });
});
