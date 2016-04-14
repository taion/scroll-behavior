import createBrowserHistory from 'history/lib/createBrowserHistory'
import createHashHistory from 'history/lib/createHashHistory'

// Use a delay between steps to let things settle.
export const DELAY = 20

export const HISTORIES = [
  createBrowserHistory,
  createHashHistory
]
