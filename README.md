# scroll-behavior [![Travis][build-badge]][build] [![npm][npm-badge]][npm]

Pluggable browser scroll management.

**If you use [React Router](https://github.com/reactjs/react-router), use [react-router-scroll](https://github.com/taion/react-router-scroll), which wraps up the scroll management logic here into a React Router middleware.** 

**If you're using the latest React Router (v4), feel free to try out its fork: https://github.com/ytase/react-router-scroll. There is one potential issue when using redirects, which may or may not be a problem for you. See ongoing discussion in [#52](https://github.com/taion/react-router-scroll/issues/52).**

**For a redux-first routing solution that makes use of `scroll-behavior`, checkout: [redux-first-router](https://github.com/faceyspacey/redux-first-router).**

[![Codecov][codecov-badge]][codecov]
[![Discord][discord-badge]][discord]

## Usage

```js
import ScrollBehavior from 'scroll-behavior';

/* ... */

const scrollBehavior = new ScrollBehavior({
  addTransitionHook,
  stateStorage,
  getCurrentLocation,
  /* shouldUpdateScroll, */
});

// After a transition:
scrollBehavior.updateScroll(/* prevContext, context */);
```

## Guide

### Installation

```
$ npm i -S scroll-behavior
```

### Basic usage

Create a `ScrollBehavior` object with the following arguments:
- `addTransitionHook`: this function should take a transition hook function and return an unregister function
  - The transition hook function should be called immediately before a transition updates the page
  - The unregister function should remove the transition hook when called
- `stateStorage`: this object should implement `read` and `save` methods
  - The `save` method should take a location object, a nullable element key, and a truthy value; it should save that value for the duration of the page session
  - The `read` method should take a location object and a nullable element key; it should return the value that `save` was called with for that location and element key, or a falsy value if no saved value is available
- `getCurrentLocation`: this function should return the current location object

This object will keep track of the scroll position. Call the `updateScroll` method on this object after transitions to emulate the default browser scroll behavior on page changes.

Call the `stop` method to tear down all listeners.

### Custom scroll behavior

You can customize the scroll behavior by providing a `shouldUpdateScroll` callback when constructing the `ScrollBehavior` object. When you call `updateScroll`, you can pass in up to two additional context arguments, which will get passed to this callback.

The callback can return:

- a falsy value to suppress updating the scroll position
- a position array of `x` and `y`, such as `[0, 100]`, to scroll to that position
- a string with the `id` or `name` of an element, to scroll to that element
- a truthy value to emulate the browser default scroll behavior

Assuming we call `updateScroll` with the previous and current location objects:

```js
const scrollBehavior = new ScrollBehavior({
  ...options,
  shouldUpdateScroll: (prevLocation, location) => (
    // Don't scroll if the pathname is the same.
    !prevLocation || location.pathname !== prevLocation.pathname
  ),
});
```

```js
const scrollBehavior = new ScrollBehavior({
  ...options,
  shouldUpdateScroll: (prevLocation, location) => (
    // Scroll to top when attempting to vist the current path.
    prevLocation && location.pathname === prevLocation.pathname ? [0, 0] : true
  ),
});
```

### Scrolling elements other than `window`

Call the `registerElement` method to register an element other than `window` to have managed scroll behavior. Each of these elements needs to be given a unique key at registration time, and can be given an optional `shouldUpdateScroll` callback that behaves as above. This method should also be called with the current context per `updateScroll` above, if applicable, to set up the element's initial scroll position.

```js
scrollBehavior.registerScrollElement(
  key, element, shouldUpdateScroll, context,
);
```

To unregister an element, call the `unregisterElement` method with the key used to register that element.


### Examples
This package is typically not used directly, but rather used to power scroll restoration solutions for popular routing libraries. If you're looking to build your own (perhaps for another routing solution), we recommend first checking out the following implementations:

- https://github.com/taion/react-router-scroll
- https://github.com/4Catalyzer/found-scroll
- https://github.com/ytase/react-router-scroll *(React Router v4 fork of `react-router-scroll`; notice how `history.listen` from the popular `history` package is used for `addTransitionHook`)*
- https://github.com/faceyspacey/redux-first-router-restore-scroll *(shows how to use the  `history` package to configure `scroll-behavior`, but leaves calling `updateScroll` to be handled manually)*

The key element of most the above packages is how `updateScroll` is called in a top level `<Context />` component on `componentDidUpdate` when the given router's location has changed:

- https://github.com/taion/react-router-scroll/blob/v0.4.2/src/ScrollBehaviorContext.js#L40-L49
- https://github.com/4Catalyzer/found-scroll/blob/v0.1.2/src/ScrollManager.js#L35-L44

In addition, if your routing library handles data fetching, you likely want to call `updateScroll` again after the data has been fetched and the page re-rendered. This allows `scroll-behavior` to scroll to a portion of the page that might not have loaded before. The same also applies if you're using code-splitting and loading additional chunks. In that case you'll also want to call `updateScroll` after components from the new chunk have rendered.

If your routing library does not handle data fetching, you may want to expose an `updateScroll` function of your own so developers can call it at the appropriate time in userland. Perhaps your users don't want a `<Context />` component constantly re-rendering (even if just in the virtual DOM), and would rather call `updateScroll` in `componentDidUpdate` callbacks that already exist. This has the benefit of reducing the amount of rendering work to be done *(cycles add up!)*, which can be key to providing the best experience in large animation-heavy applications.


[build-badge]: https://img.shields.io/travis/taion/scroll-behavior/master.svg
[build]: https://travis-ci.org/taion/scroll-behavior

[npm-badge]: https://img.shields.io/npm/v/scroll-behavior.svg
[npm]: https://www.npmjs.org/package/scroll-behavior

[codecov-badge]: https://img.shields.io/codecov/c/github/taion/scroll-behavior/master.svg
[codecov]: https://codecov.io/gh/taion/scroll-behavior

[discord-badge]: https://img.shields.io/badge/Discord-join%20chat%20%E2%86%92-738bd7.svg
[discord]: https://discord.gg/0ZcbPKXt5bYaNQ46
