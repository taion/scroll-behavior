import createHashHistory from 'history/lib/createHashHistory';

export function createHashHistoryWithoutKey() {
  // Avoid persistence of stored data from previous tests.
  window.sessionStorage.clear();

  return createHashHistory({ queryKey: false });
}

export function withRoutes(history) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  // This will only be called once, so no need to guard.
  function listen(listener) {
    const unlisten = history.listen(location => {
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

export function withScrollNode(history) {
  const container = document.createElement('div');
  container.style.height = '100px';
  container.style.width = '100px';
  container.style.overflow = 'hidden';

  const node = document.createElement('div');
  node.style.height = '20000px';
  node.style.width = '20000px';

  container.appendChild(node);
  document.body.appendChild(container);

  // This will only be called once, so no need to guard.
  function listen(listener) {
    const unlisten = history.listen(listener);

    history.registerScrollNode('container', container);

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

export function withScrollNodeRoutes(history) {
  const container = document.createElement('div');
  container.style.height = '100px';
  container.style.width = '100px';
  container.style.overflow = 'hidden';
  document.body.appendChild(container);

  let node;
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

    const unlisten = history.listen(location => {
      listener(location);

      if (location.pathname === '/') {
        node = document.createElement('div');
        node.style.height = '20000px';
        node.style.width = '20000px';
        container.appendChild(node);

        unregister = history.registerScrollNode(
          'container', container, shouldUpdateScroll
        );
      } else {
        container.removeChild(node);
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
