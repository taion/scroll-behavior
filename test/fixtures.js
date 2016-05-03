export function withRoutes(history) {
  let container;

  // This will only be called once, so no need to guard.
  function listen(listener) {
    container = document.createElement('div');
    document.body.appendChild(container);

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
      container = null;
    };
  }

  return {
    ...history,
    listen,
  };
}
