import off from 'dom-helpers/events/off';
import on from 'dom-helpers/events/on';
import scrollLeft from 'dom-helpers/query/scrollLeft';
import scrollTop from 'dom-helpers/query/scrollTop';
import requestAnimationFrame from 'dom-helpers/util/requestAnimationFrame';
import { readState, saveState } from 'history/lib/DOMStateStorage';

// Try at most this many times to scroll, to avoid getting stuck.
const MAX_SCROLL_ATTEMPTS = 2;

export default class ScrollBehavior {
  constructor(history, getCurrentKey) {
    this.getCurrentKey = getCurrentKey;

    // This helps avoid some jankiness in fighting against the browser's
    // default scroll behavior on `POP` transitions.
    /* istanbul ignore if: not supported by any browsers on Travis */
    if ('scrollRestoration' in window.history) {
      this.oldScrollRestoration = window.history.scrollRestoration;
      window.history.scrollRestoration = 'manual';
    } else {
      this.oldScrollRestoration = null;
    }

    this.savePositionHandle = null;
    this.checkScrollHandle = null;
    this.scrollTarget = null;
    this.numScrollAttempts = 0;

    // We have to listen to each scroll update rather than to just location
    // updates, because some browsers will update scroll position before
    // emitting the location change.
    on(window, 'scroll', this.onScroll);

    this.unlistenBefore = history.listenBefore(() => {
      if (this.savePositionHandle !== null) {
        requestAnimationFrame.cancel(this.savePositionHandle);
        this.savePositionHandle = null;
      }
    });
  }

  stop() {
    /* istanbul ignore if: not supported by any browsers on Travis */
    if (this.oldScrollRestoration) {
      window.history.scrollRestoration = this.oldScrollRestoration;
    }

    off(window, 'scroll', this.onScroll);
    this.cancelCheckScroll();

    this.unlistenBefore();
  }

  updateScroll(scrollPosition) {
    // Whatever we were doing before isn't relevant any more.
    this.cancelCheckScroll();

    if (scrollPosition && !Array.isArray(scrollPosition)) {
      this.scrollTarget = this.getScrollPosition();
    } else {
      this.scrollTarget = scrollPosition;
    }

    // Check the scroll position to see if we even need to scroll.
    this.onScroll();

    if (!this.scrollTarget) {
      return;
    }

    this.numScrollAttempts = 0;
    this.checkScrollPosition();
  }

  onScroll = () => {
    // It's possible that this scroll operation was triggered by what will be a
    // `POP` transition. Instead of updating the saved location immediately, we
    // have to enqueue the update, then potentially cancel it if we observe a
    // location update.
    if (this.savePositionHandle === null) {
      this.savePositionHandle = requestAnimationFrame(this.savePosition);
    }

    if (this.scrollTarget) {
      const [xTarget, yTarget] = this.scrollTarget;
      const x = scrollLeft(window);
      const y = scrollTop(window);

      if (x === xTarget && y === yTarget) {
        this.scrollTarget = null;
        this.cancelCheckScroll();
      }
    }
  };

  savePosition = () => {
    this.savePositionHandle = null;

    const currentKey = this.getCurrentKey();
    const scrollPosition = [scrollLeft(window), scrollTop(window)];

    // We have to directly update `DOMStateStorage`, because actually updating
    // the location could cause e.g. React Router to re-render the entire page,
    // which would lead to observably bad scroll performance.
    const state = readState(currentKey);
    saveState(currentKey, { ...state, scrollPosition });
  };

  cancelCheckScroll() {
    if (this.checkScrollHandle !== null) {
      requestAnimationFrame.cancel(this.checkScrollHandle);
      this.checkScrollHandle = null;
    }
  }

  getScrollPosition() {
    const state = readState(this.getCurrentKey());
    if (!state || !state.scrollPosition) {
      return [0, 0];
    }

    return state.scrollPosition;
  }

  checkScrollPosition = () => {
    this.checkScrollHandle = null;

    // We can only get here if scrollTarget is set. Every code path that unsets
    // scroll target also cancels the handle to avoid calling this handler.
    // Still, check anyway just in case.
    /* istanbul ignore if: paranoid guard */
    if (!this.scrollTarget) {
      return;
    }

    const [x, y] = this.scrollTarget;
    window.scrollTo(x, y);

    ++this.numScrollAttempts;

    /* istanbul ignore if: paranoid guard */
    if (this.numScrollAttempts >= MAX_SCROLL_ATTEMPTS) {
      this.scrollTarget = null;
      return;
    }

    this.checkScrollHandle = requestAnimationFrame(this.checkScrollPosition);
  };
}
