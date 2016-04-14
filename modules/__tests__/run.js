import { DELAY } from './config'

export default function run(history, steps) {
  window.history.replaceState(null, null, '/')

  let i = 0

  return history.listen(() => {
    if (i === steps.length) {
      return
    }

    // First wait a extra tick for all the scroll callbacks to fire before
    // position, even if we don't need an extra delay.
    setTimeout(steps[i++], DELAY)
  })
}
