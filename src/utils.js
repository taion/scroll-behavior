export function isMobileSafari() {
  return (
    /iPad|iPhone|iPod/.test(window.navigator.platform) &&
    /^((?!CriOS).)*Safari/.test(window.navigator.userAgent)
  );
}

export function isWindow(node) {
  if (node === node.window) {
    return node;
  }
  if (node.nodeType === 9) {
    return node.defaultView || node.parentWindow;
  }
  return false;
}

// eslint-disable-next-line consistent-return
export function scrollTop(node, val) {
  const win = isWindow(node);
  if (val === undefined) {
    if (win) {
      if ('pageYOffset' in win) {
        return win.pageYOffset;
      }
      return win.document.documentElement.scrollTop;
    }
    return node.scrollTop;
  }
  if (win) {
    win.scrollTo(
      'pageXOffset' in win
        ? win.pageXOffset
        : win.document.documentElement.scrollLeft,
      val,
    );
  } else {
    // eslint-disable-next-line no-param-reassign
    node.scrollTop = val;
  }
}
