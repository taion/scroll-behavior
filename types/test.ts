// TypeScript Version: 3.0

import ScrollBehavior from 'scroll-behavior';

interface Location {
  action: string;
  pathname: string;
}

interface Context {
  location: Location;
}

const location = {
  action: 'PUSH',
  pathname: '/foo',
};

const scrollBehavior = new ScrollBehavior<Location, Context>({
  addNavigationListener: (_listener) => () => {},
  stateStorage: {
    save: (_location, _key, _value) => {},
    read: (_location, _key) => [0, 0],
  },
  getCurrentLocation: () => location,
  shouldUpdateScroll: (_prevContext, _context) => true,
});

scrollBehavior.updateScroll(null, { location });
scrollBehavior.updateScroll({ location }, { location });

// $ExpectError
scrollBehavior.updateScroll(location, location);

scrollBehavior.registerElement(
  'foo',
  document.createElement('DIV'),
  () => false,
  { location },
);

scrollBehavior.unregisterElement('foo');
