/* eslint-disable no-underscore-dangle */

import off from 'dom-helpers/events/off';
import on from 'dom-helpers/events/on';
import scrollLeft from 'dom-helpers/query/scrollLeft';
import scrollTop from 'dom-helpers/query/scrollTop';
import requestAnimationFrame from 'dom-helpers/util/requestAnimationFrame';
import invariant from 'invariant';

import { isMobileSafari } from './utils';

// Try at most this many times to scroll, to avoid getting stuck.
const MAX_SCROLL_ATTEMPTS = 2;

export default class ScrollBehavior {
  constructor({
    addTransitionHook,
    stateStorage,
    getCurrentLocation,
    shouldUpdateScroll,
  }) {
    this._stateStorage = stateStorage;
    this._getCurrentLocation = getCurrentLocation;
    this._shouldUpdateScroll = shouldUpdateScroll;

    // This helps avoid some jankiness in fighting against the browser's
    // default scroll behavior on `POP` transitions.
    /* istanbul ignore else: Travis browsers all support this */
    if (
      'scrollRestoration' in window.history &&
      // Unfortunately, Safari on iOS freezes for 2-6s after the user swipes to
      // navigate through history with scrollRestoration being 'manual', so we
      // need to detect this browser and exclude it from the following code
      // until this bug is fixed by Apple.
      !isMobileSafari()
    ) {
      this._oldScrollRestoration = window.history.scrollRestoration;
      try {
        window.history.scrollRestoration = 'manual';

        // Scroll restoration persists across page reloads. We want to reset
        // this to the original value, so that we can let the browser handle
        // restoring the initial scroll position on server-rendered pages.
        on(window, 'beforeunload', this._restoreScrollRestoration);
      } catch (e) {
        this._oldScrollRestoration = null;
      }
    } else {
      this._oldScrollRestoration = null;
    }

    this._saveWindowPositionHandle = null;
    this._checkWindowScrollHandle = null;
    this._windowScrollTarget = null;
    this._numWindowScrollAttempts = 0;

    this._scrollElements = {};

    // Test via a getter in the options object to see if the passive property is accessed
    this._supportsPassive = false;
    try {
      const opts = Object.defineProperty({}, 'passive', {
        get() {
          this._supportsPassive = true;
        },
      });
      window.addEventListener('testPassive', null, opts);
      window.removeEventListener('testPassive', null, opts);
    } catch (e) {
      
    }

    // We have to listen to each window scroll update rather than to just
    // location updates, because some browsers will update scroll position
    // before emitting the location change.
    on(
      window,
      'scroll',
      this._onWindowScroll,
      this._supportsPassive ? { passive: true } : false,
    );

    this._removeTransitionHook = addTransitionHook(() => {
      requestAnimationFrame.cancel(this._saveWindowPositionHandle);
      this._saveWindowPositionHandle = null;

      Object.keys(this._scrollElements).forEach(key => {
        const scrollElement = this._scrollElements[key];
        requestAnimationFrame.cancel(scrollElement.savePositionHandle);
        scrollElement.savePositionHandle = null;

        // It's fine to save element scroll positions here, though; the browser
        // won't modify them.
        this._saveElementPosition(key);
      });
    });
  }

  registerElement(key, element, shouldUpdateScroll, context) {
    invariant(
      !this._scrollElements[key],
      'ScrollBehavior: There is already an element registered for `%s`.',
      key,
    );

    const saveElementPosition = () => {
      this._saveElementPosition(key);
    };

    const scrollElement = {
      element,
      shouldUpdateScroll,
      savePositionHandle: null,

      onScroll() {
        if (!scrollElement.savePositionHandle) {
          scrollElement.savePositionHandle = requestAnimationFrame(
            saveElementPosition,
          );
        }
      },
    };

    this._scrollElements[key] = scrollElement;
    on(
      element,
      'scroll',
      scrollElement.onScroll,
      this._supportsPassive ? { passive: true } : false,
    );

    this._updateElementScroll(key, null, context);
  }

  unregisterElement(key) {
    invariant(
      this._scrollElements[key],
      'ScrollBehavior: There is no element registered for `%s`.',
      key,
    );

    const { element, onScroll, savePositionHandle } = this._scrollElements[
      key
    ];

    off(element, 'scroll', onScroll);
    requestAnimationFrame.cancel(savePositionHandle);

    delete this._scrollElements[key];
  }

  updateScroll(prevContext, context) {
    this._updateWindowScroll(prevContext, context);

    Object.keys(this._scrollElements).forEach(key => {
      this._updateElementScroll(key, prevContext, context);
    });
  }

  _restoreScrollRestoration = () => {
    /* istanbul ignore if: not supported by any browsers on Travis */
    if (this._oldScrollRestoration) {
      try {
        window.history.scrollRestoration = this._oldScrollRestoration;
      } catch (e) {
        /* silence */
      }
    }
  };

  stop() {
    this._restoreScrollRestoration();

    off(window, 'scroll', this._onWindowScroll);
    this._cancelCheckWindowScroll();

    this._removeTransitionHook();
  }

  _onWindowScroll = () => {
    // It's possible that this scroll operation was triggered by what will be a
    // `POP` transition. Instead of updating the saved location immediately, we
    // have to enqueue the update, then potentially cancel it if we observe a
    // location update.
    if (!this._saveWindowPositionHandle) {
      this._saveWindowPositionHandle = requestAnimationFrame(
        this._saveWindowPosition,
      );
    }

    if (this._windowScrollTarget) {
      const [xTarget, yTarget] = this._windowScrollTarget;
      const x = scrollLeft(window);
      const y = scrollTop(window);

      if (x === xTarget && y === yTarget) {
        this._windowScrollTarget = null;
        this._cancelCheckWindowScroll();
      }
    }
  };

  _saveWindowPosition = () => {
    this._saveWindowPositionHandle = null;

    this._savePosition(null, window);
  };

  _cancelCheckWindowScroll() {
    requestAnimationFrame.cancel(this._checkWindowScrollHandle);
    this._checkWindowScrollHandle = null;
  }

  _saveElementPosition(key) {
    const scrollElement = this._scrollElements[key];
    scrollElement.savePositionHandle = null;

    this._savePosition(key, scrollElement.element);
  }

  _savePosition(key, element) {
    this._stateStorage.save(this._getCurrentLocation(), key, [
      scrollLeft(element),
      scrollTop(element),
    ]);
  }

  _updateWindowScroll(prevContext, context) {
    // Whatever we were doing before isn't relevant any more.
    this._cancelCheckWindowScroll();

    this._windowScrollTarget = this._getScrollTarget(
      null,
      this._shouldUpdateScroll,
      prevContext,
      context,
    );

    // Updating the window scroll position is really flaky. Just trying to
    // scroll it isn't enough. Instead, try to scroll a few times until it
    // works.
    this._numWindowScrollAttempts = 0;
    this._checkWindowScrollPosition();
  }

  _updateElementScroll(key, prevContext, context) {
    const { element, shouldUpdateScroll } = this._scrollElements[key];

    const scrollTarget = this._getScrollTarget(
      key,
      shouldUpdateScroll,
      prevContext,
      context,
    );
    if (!scrollTarget) {
      return;
    }

    // Unlike with the window, there shouldn't be any flakiness to deal with
    // here.
    this.scrollToTarget(element, scrollTarget);
  }

  _getDefaultScrollTarget(location) {
    const { hash } = location;
    if (hash && hash !== '#') {
      return hash.charAt(0) === '#' ? hash.slice(1) : hash;
    }
    return [0, 0];
  }

  _getScrollTarget(key, shouldUpdateScroll, prevContext, context) {
    const scrollTarget = shouldUpdateScroll
      ? shouldUpdateScroll.call(this, prevContext, context)
      : true;

    if (
      !scrollTarget ||
      Array.isArray(scrollTarget) ||
      typeof scrollTarget === 'string'
    ) {
      return scrollTarget;
    }

    const location = this._getCurrentLocation();

    return (
      this._getSavedScrollTarget(key, location) ||
      this._getDefaultScrollTarget(location)
    );
  }

  _getSavedScrollTarget(key, location) {
    if (location.action === 'PUSH') {
      return null;
    }

    return this._stateStorage.read(location, key);
  }

  _checkWindowScrollPosition = () => {
    this._checkWindowScrollHandle = null;

    // We can only get here if scrollTarget is set. Every code path that unsets
    // scroll target also cancels the handle to avoid calling this handler.
    // Still, check anyway just in case.
    /* istanbul ignore if: paranoid guard */
    if (!this._windowScrollTarget) {
      return;
    }

    this.scrollToTarget(window, this._windowScrollTarget);

    ++this._numWindowScrollAttempts;

    /* istanbul ignore if: paranoid guard */
    if (this._numWindowScrollAttempts >= MAX_SCROLL_ATTEMPTS) {
      this._windowScrollTarget = null;
      return;
    }

    this._checkWindowScrollHandle = requestAnimationFrame(
      this._checkWindowScrollPosition,
    );
  };

  scrollToTarget(element, target) {
    if (typeof target === 'string') {
      const targetElement =
        document.getElementById(target) ||
        document.getElementsByName(target)[0];
      if (targetElement) {
        targetElement.scrollIntoView();
        return;
      }

      // Fallback to scrolling to top when target fragment doesn't exist.
      target = [0, 0]; // eslint-disable-line no-param-reassign
    }

    const [left, top] = target;
    scrollLeft(element, left);
    scrollTop(element, top);
  }
}
