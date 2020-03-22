export function withRoutes(history) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const child1 = document.createElement('div');
  child1.id = 'child1';
  child1.style.height = '100px';
  container.appendChild(child1);

  const child2 = document.createElement('a');
  child2.id = 'child2-id';
  child2.name = 'child2';
  child2.style.height = '100px';
  child2.appendChild(document.createTextNode('link'));
  container.appendChild(child2);

  // This will only be called once, so no need to guard.
  function listen(listener) {
    const unlisten = history.listen((location) => {
      listener(location);

      if (location.pathname === '/') {
        container.style.height = '20000px';
        container.style.width = '20000px';
      } else {
        container.style.height = '10000px';
        container.style.width = '10000px';
      }
    });

    return () => {
      unlisten();
      document.body.removeChild(container);
    };
  }

  return {
    ...history,
    listen,
  };
}

export function withScrollElement(history) {
  const container = document.createElement('div');
  container.style.height = '100px';
  container.style.width = '100px';
  container.style.overflow = 'hidden';

  const element = document.createElement('div');
  element.style.height = '20000px';
  element.style.width = '20000px';

  container.appendChild(element);
  document.body.appendChild(container);

  // This will only be called once, so no need to guard.
  function listen(listener) {
    const unlisten = history.listen(listener);

    history.registerScrollElement('container', container);

    return () => {
      unlisten();
      document.body.removeChild(container);
    };
  }

  return {
    ...history,
    container,
    listen,
  };
}

export function withScrollElementRoutes(history) {
  const container = document.createElement('div');
  container.style.height = '100px';
  container.style.width = '100px';
  container.style.overflow = 'hidden';
  document.body.appendChild(container);

  let element;
  let unregister;

  // This will only be called once, so no need to guard.
  function listen(listener) {
    function shouldUpdateScroll(prevLocation, location) {
      // Disable the automatic scroll restoration after the POP, to check the
      // scroll-on-register behavior.
      if (prevLocation && location.action === 'POP') {
        return false;
      }

      return true;
    }

    const unlisten = history.listen((location) => {
      listener(location);

      if (location.pathname === '/') {
        element = document.createElement('div');
        element.style.height = '20000px';
        element.style.width = '20000px';
        container.appendChild(element);

        unregister = history.registerScrollElement(
          'container',
          container,
          shouldUpdateScroll,
        );
      } else {
        container.removeChild(element);
        unregister();
      }
    });

    return () => {
      unlisten();
      document.body.removeChild(container);
    };
  }

  return {
    ...history,
    container,
    listen,
  };
}
