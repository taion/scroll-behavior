import { DELAY } from './config'

export default function delay(cb) {
  // Give throttled scroll listeners time to settle down.
  requestAnimationFrame(() => setTimeout(cb, DELAY))
}
