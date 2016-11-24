/* eslint-disable no-underscore-dangle */

import off from 'dom-helpers/events/off';
import on from 'dom-helpers/events/on';
import scrollLeft from 'dom-helpers/query/scrollLeft';
import scrollTop from 'dom-helpers/query/scrollTop';
import requestAnimationFrame from 'dom-helpers/util/requestAnimationFrame';
import invariant from 'invariant';

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
    /* istanbul ignore if: not supported by any browsers on Travis */
    if ('scrollRestoration' in window.history) {
      this._oldScrollRestoration = window.history.scrollRestoration;
      window.history.scrollRestoration = 'manual';
    } else {
      this._oldScrollRestoration = null;
    }

    this._saveWindowPositionHandle = null;
    this._checkWindowScrollHandle = null;
    this._windowScrollTarget = null;
    this._numWindowScrollAttempts = 0;

    this._scrollElements = {};

    // We have to listen to each window scroll update rather than to just
    // location updates, because some browsers will update scroll position
    // before emitting the location change.
    on(window, 'scroll', this._onWindowScroll);

    this._removeTransitionHook = addTransitionHook(() => {
      if (this._saveWindowPositionHandle !== null) {
        requestAnimationFrame.cancel(this._saveWindowPositionHandle);
        this._saveWindowPositionHandle = null;
      }

      // It's fine to save element scroll positions here, though; the browser
      // won't modify them.
      Object.keys(this._scrollElements).forEach((key) => {
        this._saveElementPosition(key);
      });
    });
  }

  registerElement(key, element, shouldUpdateScroll, context) {
    invariant(
      !this._scrollElements[key],
      'ScrollBehavior: There is already an element registered for `%s`.',
      key
    );

    this._scrollElements[key] = { element, shouldUpdateScroll };
    this._updateElementScroll(key, null, context);
  }

  unregisterElement(key) {
    invariant(
      this._scrollElements[key],
      'ScrollBehavior: There is no element registered for `%s`.',
      key
    );

    delete this._scrollElements[key];
  }

  updateScroll(prevContext, context) {
    this._updateWindowScroll(prevContext, context);

    Object.keys(this._scrollElements).forEach((key) => {
      this._updateElementScroll(key, prevContext, context);
    });
  }

  stop() {
    /* istanbul ignore if: not supported by any browsers on Travis */
    if (this._oldScrollRestoration) {
      window.history.scrollRestoration = this._oldScrollRestoration;
    }

    off(window, 'scroll', this._onWindowScroll);
    this._cancelCheckWindowScroll();

    this._removeTransitionHook();
  }

  _onWindowScroll = () => {
    // It's possible that this scroll operation was triggered by what will be a
    // `POP` transition. Instead of updating the saved location immediately, we
    // have to enqueue the update, then potentially cancel it if we observe a
    // location update.
    if (this._saveWindowPositionHandle === null) {
      this._saveWindowPositionHandle =
        requestAnimationFrame(this._saveWindowPosition);
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
    if (this._checkWindowScrollHandle !== null) {
      requestAnimationFrame.cancel(this._checkWindowScrollHandle);
      this._checkWindowScrollHandle = null;
    }
  }

  _saveElementPosition(key) {
    const { element } = this._scrollElements[key];

    this._savePosition(key, element);
  }

  _savePosition(key, element) {
    this._stateStorage.save(
      this._getCurrentLocation(),
      key,
      [scrollLeft(element), scrollTop(element)],
    );
  }

  _updateWindowScroll(prevContext, context) {
    // Whatever we were doing before isn't relevant any more.
    this._cancelCheckWindowScroll();

    this._windowScrollTarget = this._getScrollTarget(
      null, this._shouldUpdateScroll, prevContext, context,
    );

    // Check the scroll position to see if we even need to scroll. This call
    // will unset _windowScrollTarget if the current scroll position matches
    // the target.
    this._onWindowScroll();

    if (!this._windowScrollTarget) {
      return;
    }

    // Updating the window scroll position is really flaky. Just trying to
    // scroll it isn't enough. Instead, try to scroll a few times until it
    // works.
    this._numWindowScrollAttempts = 0;
    requestAnimationFrame(this._checkWindowScrollPosition);
  }

  _updateElementScroll(key, prevContext, context) {
    const { element, shouldUpdateScroll } = this._scrollElements[key];

    const scrollTarget = this._getScrollTarget(
      key, shouldUpdateScroll, prevContext, context,
    );
    if (!scrollTarget) {
      return;
    }

    // Unlike with the window, there shouldn't be any flakiness to deal with
    // here.
    const [x, y] = scrollTarget;
    scrollLeft(element, x);
    scrollTop(element, y);
  }

  _getScrollTarget(key, shouldUpdateScroll, prevContext, context) {
    const scrollTarget = shouldUpdateScroll ?
      shouldUpdateScroll.call(this, prevContext, context) : true;

    if (!scrollTarget || Array.isArray(scrollTarget)) {
      return scrollTarget;
    }

    const location = this._getCurrentLocation();
    if (location.action === 'PUSH') {
      return [0, 0];
    }

    return this._stateStorage.read(location, key) || [0, 0];
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

    const [x, y] = this._windowScrollTarget;
    window.scrollTo(x, y);

    ++this._numWindowScrollAttempts;

    /* istanbul ignore if: paranoid guard */
    if (this._numWindowScrollAttempts >= MAX_SCROLL_ATTEMPTS) {
      this._windowScrollTarget = null;
      return;
    }

    this._checkWindowScrollHandle =
      requestAnimationFrame(this._checkWindowScrollPosition);
  };
}
