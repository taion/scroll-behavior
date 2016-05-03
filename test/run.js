export function delay(cb) {
  // Give throttled scroll listeners time to settle down.
  requestAnimationFrame(() => setTimeout(cb));
}

export default function run(history, steps) {
  window.history.replaceState(null, null, '/');

  let i = 0;
  let running = false;

  return history.listen(() => {
    if (i === steps.length) {
      return;
    }

    // Don't spuriously fire steps while things are settling down before the
    // first step.
    if (i === 0) {
      if (running) {
        return;
      }

      running = true;
    }

    // First wait a extra tick for all the scroll callbacks to fire before
    // position, even if we don't need an extra delay.
    delay(() => {
      // Don't increment i until we run the step, for the above check.
      steps[i++]();
    });
  });
}
