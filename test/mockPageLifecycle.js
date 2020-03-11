let listener;

export const setEventListener = (eventType, callback) => {
  listener = callback;
};

export const triggerEvent = (oldState, newState) => {
  if (listener) {
    const event = new Event('statechange');
    event.newState = newState;
    event.oldState = oldState;
    listener(event);
  }
};
