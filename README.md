# scroll-behavior [![Travis][build-badge]][build] [![npm package][npm-badge]][npm]

Scroll behaviors for use with [`history`](https://github.com/reactjs/history).

[![Coveralls][coveralls-badge]][coveralls]
[![Discord][discord-badge]][discord]

## Usage

Enhance your history object with one of the scroll behaviors in this library to get the desired scroll behavior after transitions.

```js
import createHistory from 'history/lib/createBrowserHistory'
import useScroll from 'scroll-behavior/lib/useStandardScroll'

const history = useScroll(createHistory)()
```

## Guide

### Installation

```
$ npm install history scroll-behavior
```

You may also want to install [React Router](https://github.com/reactjs/react-router) to obtain a complete routing solution for React that works with `history`. 

### Scroll behaviors

#### `useScrollToTop`

`useScrollToTop` scrolls to the top of the page after any transition.

This is not fully reliable for `POP` transitions.

#### `useSimpleScroll`

`useSimpleScroll` scrolls to the top of the page on `PUSH` and `REPLACE` transitions, while allowing the browser to manage scroll position for `POP` transitions.

This can give pretty good results with synchronous transitions on browsers like Chrome that don't update the scroll position until after they've notified `history` of the location change. It will not work as well when using asynchronous transitions or with browsers like Firefox that update the scroll position before emitting the location change.

#### `useStandardScroll`

`useStandardScroll` attempts to imitate native browser scroll behavior by recording updates to the window scroll position, then restoring the previous scroll position upon a `POP` transition.

### Notes

- Support for async transitions is currently very poor. Fixing this will require major breaking API changes in the future.

[build-badge]: https://img.shields.io/travis/taion/scroll-behavior/master.svg?style=flat-square
[build]: https://travis-ci.org/taion/scroll-behavior

[npm-badge]: https://img.shields.io/npm/v/scroll-behavior.svg?style=flat-square
[npm]: https://www.npmjs.org/package/scroll-behavior

[coveralls-badge]: https://img.shields.io/coveralls/taion/scroll-behavior/master.svg?style=flat-square
[coveralls]: https://coveralls.io/github/taion/scroll-behavior

[discord-badge]: https://img.shields.io/badge/Discord-join%20chat%20%E2%86%92-738bd7.svg?style=flat-square
[discord]: https://discord.gg/0ZcbPKXt5bYaNQ46
