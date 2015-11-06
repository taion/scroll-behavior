# scroll-behavior 

[![npm package](https://img.shields.io/npm/v/scroll-behavior.svg?style=flat-square)](https://www.npmjs.org/package/scroll-behavior)
[![build status](https://img.shields.io/travis/rackt/scroll-behavior/master.svg?style=flat-square)](https://travis-ci.org/rackt/scroll-behavior)
[![#rackt on freenode](https://img.shields.io/badge/irc-rackt_on_freenode-61DAFB.svg?style=flat-square)](https://webchat.freenode.net/)

Scroll behaviors for use with [`history`](https://github.com/rackt/history).

## Usage

Enhance your history object with one of the scroll behaviors in this library to get the desired scroll behavior after transitions.

```js
import createHistory from 'history/lib/createBrowserHistory'
import useScrollBehavior from 'scroll-behavior/lib/useStandardScrollBehavior'

const history = useScrollBehavior(createHistory)()
```

## Guide

### Installation

```
$ npm install history scroll-behavior
```

You may also want to install [React Router](https://github.com/rackt/react-router) to obtain a complete routing solution for React that works with `history`. 

### Scroll behaviors

#### `useScrollToTopBehavior`

`useScrollToTopBehavior` scrolls to the top of the page after any transition.

This is not fully reliable for `POP` transitions.

#### `useSimpleScrollBehavior`

`useSimpleScrollBehavior` scrolls to the top of the page on `PUSH` and `REPLACE` transitions, while allowing the browser to manage scroll position for `POP` transitions.

This can give pretty good results with synchronous transitions on browsers like Chrome that don't update the scroll position until after they've notified `history` of the location change. It will not work as well when using asynchronous transitions or with browsers like Firefox that update the scroll position before emitting the location change.

#### `useStandardScrollBehavior`

`useStandardScrollBehavior` attempts to imitate native browser scroll behavior by recording updates to the window scroll position, then restoring the previous scroll position upon a `POP` transition.
