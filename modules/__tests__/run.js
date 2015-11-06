export default function run(history, steps, delay) {
  window.history.replaceState(null, null, '/')

  let i = 0

  return history.listen(() => {
    if (i === steps.length) {
      return
    }

    setTimeout(steps[i++], delay)
  })
}
