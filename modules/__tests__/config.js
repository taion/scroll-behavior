import createBrowserHistory from 'history/lib/createBrowserHistory'
import createHashHistory from 'history/lib/createHashHistory'

export const HISTORIES = [
  createBrowserHistory,
  createHashHistory
]
