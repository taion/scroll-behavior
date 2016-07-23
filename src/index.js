import ScrollBehavior from './ScrollBehavior';

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

    scrollBehavior.getContainerKeys().forEach(containerKey => {
      let scrollPosition;
      if (!shouldUpdateScroll) {
        scrollPosition = true;
      } else {
        scrollPosition = shouldUpdateScroll.call(
          scrollBehavior, prevLocation, location, containerKey
        );
      }

      scrollBehavior.updateScroll(containerKey, scrollPosition);
    });
  }

  let unlisten = null;

  function listen(listener) {
    if (listeners.length === 0) {
      scrollBehavior = new ScrollBehavior(history, getCurrentLocation);
      unlisten = history.listen(onChange);
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

  return {
    ...history,
    listen,
    registerScrollContainer(...params) {
      scrollBehavior.registerContainer(...params);
    },
    unregisterScrollContainer(...params) {
      scrollBehavior.unregisterContainer(...params);
    },
  };
}
