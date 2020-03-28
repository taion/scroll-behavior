import { readState, saveState } from 'history/lib/DOMStateStorage';

import ScrollBehavior from '../src';

const STATE_KEY_PREFIX = '@@scroll|';

class HistoryStateStorage {
  constructor(history) {
    this.getFallbackLocationKey = history.createPath;
  }

  read(location, key) {
    return readState(this.getStateKey(location, key));
  }

  save(location, key, value) {
    saveState(this.getStateKey(location, key), value);
  }

  getStateKey(location, key) {
    const locationKey = location.key || this.getFallbackLocationKey(location);
    const stateKeyBase = `${STATE_KEY_PREFIX}${locationKey}`;
    return key == null ? stateKeyBase : `${stateKeyBase}|${key}`;
  }
}

export default function withScroll(history, shouldUpdateScroll) {
  // history v2 will invoke the onChange callback synchronously, so
  // currentLocation will always be defined when needed.
  let currentLocation = null;

  function getCurrentLocation() {
    return currentLocation;
  }

  let listeners = [];
  let scrollBehavior = null;

  function onChange(location) {
    const prevLocation = currentLocation;
    currentLocation = location;

    listeners.forEach((listener) => {
      listener(location);
    });

    scrollBehavior.updateScroll(prevLocation, location);
  }

  let unlisten = null;

  function listen(listener) {
    if (listeners.length === 0) {
      scrollBehavior = new ScrollBehavior({
        addNavigationListener: history.listenBefore,
        stateStorage: new HistoryStateStorage(history),
        getCurrentLocation,
        shouldUpdateScroll,
      });
      unlisten = history.listen(onChange);
    }

    listeners.push(listener);
    listener(currentLocation);

    return () => {
      listeners = listeners.filter((item) => item !== listener);

      if (listeners.length === 0) {
        scrollBehavior.stop();
        unlisten();
      }
    };
  }

  function registerScrollElement(key, element, shouldUpdateElementScroll) {
    scrollBehavior.registerElement(
      key,
      element,
      shouldUpdateElementScroll,
      currentLocation,
    );

    return () => {
      scrollBehavior.unregisterElement(key);
    };
  }

  function startIgnoringScrollEvents() {
    scrollBehavior.startIgnoringScrollEvents();
  }

  function stopIgnoringScrollEvents() {
    scrollBehavior.stopIgnoringScrollEvents();
  }

  return {
    ...history,
    listen,
    registerScrollElement,
    startIgnoringScrollEvents,
    stopIgnoringScrollEvents,
  };
}
