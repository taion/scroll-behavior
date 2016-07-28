import isWindow from 'dom-helpers/query/isWindow';

export default function scrollTo(node, x, y) {
  if (isWindow(node)) {
    node.scrollTo(x, y);
  } else {
    /* eslint-disable no-param-reassign */
    node.scrollLeft = x;
    node.scrollTop = y;
    /* eslint-enable no-param-reassign */
  }
}
