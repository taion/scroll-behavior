// TypeScript Version: 3.0

declare module 'scroll-behavior' {
  interface TransitionHook {
    (): void;
  }

  interface LocationBase {
    action: 'PUSH' | string;
    hash?: string;
  }

  type ScrollPosition = [number, number];

  type ScrollTarget = ScrollPosition | string | boolean | null | undefined;

  interface ShouldUpdateScroll<TContext> {
    (prevContext: TContext | null, context: TContext): ScrollTarget;
  }

  interface ScrollBehaviorOptions<TLocation extends LocationBase, TContext> {
    addTransitionHook: (hook: TransitionHook) => () => void;
    stateStorage: {
      save: (
        location: TLocation,
        key: string | null,
        value: ScrollPosition,
      ) => void;
      read: (
        location: TLocation,
        key: string | null,
      ) => ScrollPosition | null | undefined;
    };
    getCurrentLocation: () => TLocation;
    shouldUpdateScroll?: ShouldUpdateScroll<TContext>;
  }

  export default class ScrollBehavior<
    TLocation extends LocationBase,
    TContext
  > {
    constructor(options: ScrollBehaviorOptions<TLocation, TContext>);

    updateScroll: (prevContext: TContext | null, context: TContext) => void;

    registerElement: (
      key: string,
      element: HTMLElement,
      shouldUpdateScroll: ShouldUpdateScroll<TContext> | null,
      context: TContext,
    ) => void;

    unregisterElement: (key: string) => void;

    scrollToTarget: (
      element: HTMLElement,
      target: ScrollPosition | string,
    ) => void;

    stop(): void;

    startIgnoringScrollEvents(): void;

    stopIgnoringScrollEvents(): void;
  }
}
