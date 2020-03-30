/* eslint-disable no-underscore-dangle */

import * as animationFrame from 'dom-helpers/animationFrame';
import scrollLeft from 'dom-helpers/scrollLeft';
import scrollTop from 'dom-helpers/scrollTop';
import invariant from 'invariant';
import PageLifecycle from 'page-lifecycle/dist/lifecycle.es5';

import { isMobileSafari } from './utils';

// Try at most this many times to scroll, to avoid getting stuck.
const MAX_SCROLL_ATTEMPTS = 2;

export default class ScrollBehavior {
  constructor({
    addNavigationListener,
    stateStorage,
    getCurrentLocation,
    shouldUpdateScroll,
  }) {
    this._stateStorage = stateStorage;
    this._getCurrentLocation = getCurrentLocation;
    this._shouldUpdateScroll = shouldUpdateScroll;
    this._oldScrollRestoration = null;

    // This helps avoid some jankiness in fighting against the browser's
    //  default scroll behavior on `POP` navigations.
    /* istanbul ignore else: Travis browsers all support this */
    this._setScrollRestoration();

    this._saveWindowPositionHandle = null;
    this._checkWindowScrollHandle = null;
    this._windowScrollTarget = null;
    this._numWindowScrollAttempts = 0;
    this._ignoreScrollEvents = false;

    this._scrollElements = {};

    // We have to listen to each window scroll update rather than to just
    //  location updates, because some browsers will update scroll position
    //  before emitting the location change.
    window.addEventListener('scroll', this._onWindowScroll);

    const handleNavigation = (saveWindowPosition) => {
      animationFrame.cancel(this._saveWindowPositionHandle);
      this._saveWindowPositionHandle = null;

      if (saveWindowPosition && !this._ignoreScrollEvents) {
        this._saveWindowPosition();
      }

      Object.keys(this._scrollElements).forEach((key) => {
        const scrollElement = this._scrollElements[key];
        animationFrame.cancel(scrollElement.savePositionHandle);
        scrollElement.savePositionHandle = null;

        // It's always fine to save element scroll positions here; the browser
        //  won't modify them.
        if (!this._ignoreScrollEvents) {
          this._saveElementPosition(key);
        }
      });
    };

    this._removeNavigationListener = addNavigationListener(({ action }) => {
      // Don't save window position on POP, as the browser may have already
      //  updated it.
      handleNavigation(action !== 'POP');
    });

    PageLifecycle.addEventListener('statechange', ({ newState }) => {
      if (
        newState === 'terminated' ||
        newState === 'frozen' ||
        newState === 'discarded'
      ) {
        handleNavigation(true);

        // Scroll restoration persists across page reloads. We want to reset
        //  this to the original value, so that we can let the browser handle
        //  restoring the initial scroll position on server-rendered pages.
        this._restoreScrollRestoration();
      } else {
        this._setScrollRestoration();
      }
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

      onScroll: () => {
        if (!scrollElement.savePositionHandle && !this._ignoreScrollEvents) {
          scrollElement.savePositionHandle = animationFrame.request(
            saveElementPosition,
          );
        }
      },
    };

    // In case no scrolling occurs, save the initial position
    if (!scrollElement.savePositionHandle && !this._ignoreScrollEvents) {
      scrollElement.savePositionHandle = animationFrame.request(
        saveElementPosition,
      );
    }

    this._scrollElements[key] = scrollElement;
    element.addEventListener('scroll', scrollElement.onScroll);

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

    element.removeEventListener('scroll', onScroll);
    animationFrame.cancel(savePositionHandle);

    delete this._scrollElements[key];
  }

  updateScroll(prevContext, context) {
    this._updateWindowScroll(prevContext, context).then(() => {
      // Save the position immediately after navigation so that if no scrolling
      //  occurs, there is still a saved position.
      if (!this._saveWindowPositionHandle) {
        this._saveWindowPositionHandle = animationFrame.request(
          this._saveWindowPosition,
        );
      }
    });

    Object.keys(this._scrollElements).forEach((key) => {
      this._updateElementScroll(key, prevContext, context);
    });
  }

  _setScrollRestoration = () => {
    if (this._oldScrollRestoration) {
      // It's possible that we already set the scroll restoration.
      return;
    }
    if (
      'scrollRestoration' in window.history &&
      // Unfortunately, Safari on iOS freezes for 2-6s after the user swipes to
      //  navigate through history with scrollRestoration being 'manual', so we
      //  need to detect this browser and exclude it from the following code
      //  until this bug is fixed by Apple.
      !isMobileSafari()
    ) {
      this._oldScrollRestoration = window.history.scrollRestoration;
      try {
        window.history.scrollRestoration = 'manual';
      } catch (e) {
        this._oldScrollRestoration = null;
      }
    }
  };

  _restoreScrollRestoration = () => {
    /* istanbul ignore if: not supported by any browsers on Travis */
    if (this._oldScrollRestoration) {
      try {
        window.history.scrollRestoration = this._oldScrollRestoration;
      } catch (e) {
        /* silence */
      }
      this._oldScrollRestoration = null;
    }
  };

  stop() {
    this._restoreScrollRestoration();

    window.removeEventListener('scroll', this._onWindowScroll);
    this._cancelCheckWindowScroll();

    this._removeNavigationListener();
  }

  startIgnoringScrollEvents() {
    this._ignoreScrollEvents = true;
  }

  stopIgnoringScrollEvents() {
    this._ignoreScrollEvents = false;
  }

  _onWindowScroll = () => {
    if (this._ignoreScrollEvents) {
      // Don't save the scroll position until navigation is complete.
      return;
    }

    // It's possible that this scroll operation was triggered by what will be a
    //  `POP` navigation. Instead of updating the saved location immediately,
    //  we have to enqueue the update, then potentially cancel it if we observe
    //  a location update.
    if (!this._saveWindowPositionHandle) {
      this._saveWindowPositionHandle = animationFrame.request(
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
    animationFrame.cancel(this._checkWindowScrollHandle);
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
    //  scroll it isn't enough. Instead, try to scroll a few times until it
    //  works.
    this._numWindowScrollAttempts = 0;
    return this._checkWindowScrollPosition();
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
    //  here.
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
    //  scroll target also cancels the handle to avoid calling this handler.
    //  Still, check anyway just in case.
    /* istanbul ignore if: paranoid guard */
    if (!this._windowScrollTarget) {
      return Promise.resolve();
    }

    this.scrollToTarget(window, this._windowScrollTarget);

    ++this._numWindowScrollAttempts;

    /* istanbul ignore if: paranoid guard */
    if (this._numWindowScrollAttempts >= MAX_SCROLL_ATTEMPTS) {
      // This might happen if the scroll position was already set to the target
      this._windowScrollTarget = null;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this._checkWindowScrollHandle = animationFrame.request(() =>
        resolve(this._checkWindowScrollPosition()),
      );
    });
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
