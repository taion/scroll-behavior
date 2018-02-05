export function isMobileSafari() {
  return (
    /iPad|iPhone|iPod/.test(window.navigator.platform) &&
    /^((?!CriOS).)*Safari/.test(window.navigator.userAgent)
  );
}
