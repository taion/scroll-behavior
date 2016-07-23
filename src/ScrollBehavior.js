import ScrollContainer from './ScrollContainer';

export default class ScrollBehavior {
  constructor(history, getCurrentLocation) {
    this._history = history;
    this._getCurrentLocation = getCurrentLocation;

    // This helps avoid some jankiness in fighting against the browser's
    // default scroll behavior on `POP` transitions.
    /* istanbul ignore if: not supported by any browsers on Travis */
    if ('scrollRestoration' in window.history) {
      this._oldScrollRestoration = window.history.scrollRestoration;
      window.history.scrollRestoration = 'manual';
    } else {
      this._oldScrollRestoration = null;
    }

    this._containers = {};
    this.registerContainer('window', window);
  }

  registerContainer(key, node) {
    this._containers[key] = new ScrollContainer(
      key,
      node,
      this._history,
      this._getCurrentLocation
    );
  }

  unregisterContainer(key) {
    this._containers[key].stop();
    delete this._containers[key];
  }

  getContainerKeys() {
    return Object.keys(this._containers);
  }

  stop() {
    /* istanbul ignore if: not supported by any browsers on Travis */
    if (this._oldScrollRestoration) {
      window.history.scrollRestoration = this._oldScrollRestoration;
    }

    this.getContainerKeys().forEach(key => {
      this.unregisterContainer(key);
    });
  }

  updateScroll(key, scrollPosition) {
    this._containers[key].updateScroll(scrollPosition);
  }
}
