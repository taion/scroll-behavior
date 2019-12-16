export function isMobileSafari() {
  return (
    /iPad|iPhone|iPod/.test(window.navigator.platform) &&
    /^((?!CriOS).)*Safari/.test(window.navigator.userAgent)
  );
}

export function debounce(callback, wait) {
  let timeout = null;

  function cancel() {
    clearTimeout(timeout);
  }

  function debounced(...args) {
    const next = () => callback.apply(this, args);
    cancel();
    timeout = setTimeout(next, wait);
  }

  debounced.cancel = cancel;

  return debounced;
}
