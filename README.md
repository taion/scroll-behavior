# scroll-behavior [![Travis][build-badge]][build] [![npm][npm-badge]][npm]

Scroll behaviors for use with [`history`](https://github.com/reactjs/history).

[![Coveralls][coveralls-badge]][coveralls]
[![Discord][discord-badge]][discord]

## Usage

Extend your history object with one of the scroll behaviors in this library to get the desired scroll behavior after transitions.

```js
import createHistory from 'history/lib/createBrowserHistory'
import withScroll from 'scroll-behavior/lib/withStandardScroll'

const history = withScroll(createHistory())
```

## Guide

### Installation

```
$ npm install history scroll-behavior
```

You may also want to install [React Router](https://github.com/reactjs/react-router) to obtain a complete routing solution for React that works with history.

### Scroll behaviors

#### `withScrollToTop`

`withScrollToTop` scrolls to the top of the page after any transition.

This is not fully reliable for `POP` transitions.

#### `withSimpleScroll`

`withSimpleScroll` scrolls to the top of the page on `PUSH` and `REPLACE` transitions, while allowing the browser to manage scroll position for `POP` transitions.

This can give pretty good results with synchronous transitions on browsers like Chrome that don't update the scroll position until after they've notified `history` of the location change. It will not work as well when using asynchronous transitions or with browsers like Firefox that update the scroll position before emitting the location change.

#### `withStandardScroll`

`withStandardScroll` attempts to imitate native browser scroll behavior by recording updates to the window scroll position, then restoring the previous scroll position upon a `POP` transition.

### Custom behavior

You can further customize scroll behavior by providing a `shouldUpdateScroll` callback when extending the history object. This callback is called with both the previous location and the current location.

You can return:

- a falsy value to suppress the scroll update
- a position array such as `[ 0, 100 ]` to scroll to that position
- a truthy value to get normal scroll behavior

```js
const history = withScroll(createHistory(), (prevLocation, location) => (
  // Don't scroll if the pathname is the same.
  location.pathname !== prevLocation.pathname
))
```

```js
const history = withScroll(createHistory(), (prevLocation, location) => (
  // Scroll to top when attempting to vist the current path.
  location.pathname === prevLocation.pathname ? [ 0, 0 ] : true
))
```

### Async transitions

If you are using async routes or async data loading, you may need to defer the update of the scroll position until the async transition is complete. You can do this by passing in a callback as the third argument to `shouldUpdateScroll`:

```js
let updateScroll

const history = withScroll(createHistory(), (prevLocation, location, cb) => {
  updateScroll = cb
})
```

After transition is finished, you can trigger the update of the scroll position by invoking the callback with the same value you would have returned from a synchronous `shouldUpdateScroll` function:

```js
updateScroll(true)
```

[build-badge]: https://img.shields.io/travis/taion/scroll-behavior/master.svg?style=flat-square
[build]: https://travis-ci.org/taion/scroll-behavior

[npm-badge]: https://img.shields.io/npm/v/scroll-behavior.svg?style=flat-square
[npm]: https://www.npmjs.org/package/scroll-behavior

[coveralls-badge]: https://img.shields.io/coveralls/taion/scroll-behavior/master.svg?style=flat-square
[coveralls]: https://coveralls.io/github/taion/scroll-behavior

[discord-badge]: https://img.shields.io/badge/Discord-join%20chat%20%E2%86%92-738bd7.svg?style=flat-square
[discord]: https://discord.gg/0ZcbPKXt5bYaNQ46
