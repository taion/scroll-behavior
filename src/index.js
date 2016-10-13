import ScrollBehavior from './scroll-behavior';

export default function withScroll(history, shouldUpdateScroll) {
  // history will invoke the onChange callback synchronously, so
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

    listeners.forEach(listener => listener(location));

    scrollBehavior.updateScroll(prevLocation, location);
  }

  let unlisten = null;

  function listen(listener) {
    if (listeners.length === 0) {
      scrollBehavior = new ScrollBehavior(
        history, getCurrentLocation, shouldUpdateScroll
      );
      unlisten = history.listen(onChange);

      // On react-router/history v3, onChange will not be called on first run
      let historyV3 = {}.hasOwnProperty.call(history, 'getCurrentLocation');
      if (historyV3 && !currentLocation) {
        currentLocation = history.getCurrentLocation();
      }
    }

    listeners.push(listener);
    listener(currentLocation);

    return () => {
      listeners = listeners.filter(item => item !== listener);

      if (listeners.length === 0) {
        scrollBehavior.stop();
        unlisten();
      }
    };
  }

  function registerScrollElement(key, element, shouldUpdateElementScroll) {
    scrollBehavior.registerElement(
      key, element, shouldUpdateElementScroll, currentLocation
    );

    return () => {
      scrollBehavior.unregisterElement(key);
    };
  }

  return {
    ...history,
    listen,
    registerScrollElement,
  };
}
