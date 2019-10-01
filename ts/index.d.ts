declare module 'scroll-behavior' {
  export type TransitionHook = () => void

  export type ScrollPosition = [number, number]

  export type ScrollTarget = string | ScrollPosition

  export type ShouldUpdateScroll<PrevContext, Context> = (
    prevContext: PrevContext,
    context: Context,
  ) => ScrollTarget | true | false

  export type ShouldUpdateElementScroll<PrevContext, Context> = (
    prevContext: PrevContext | null,
    context: Context,
  ) => ScrollTarget | true | false

  type ScrollBehaviorArgs<
    Loc extends { hash?: string; action?: 'PUSH' | string },
    PrevContext = Location,
    Context = PrevContext
  > = {
    addTransitionHook: (hook: TransitionHook) => () => void
    stateStorage: {
      save: (location: Loc, key: string | null, value: ScrollPosition) => void
      read: (location: Loc, key: string | null) => ScrollPosition | null
    }
    getCurrentLocation: () => Loc
    shouldUpdateScroll?: ShouldUpdateScroll<PrevContext, Context>
  }

  export default class ScrollBehavior<
    Loc = Location,
    PrevContext = Location | null,
    Context = Location
  > {
    constructor(options: ScrollBehaviorArgs<Loc, PrevContext, Context>)

    updateScroll: (prevContext?: PrevContext, context?: Context) => void

    registerElement: (
      key: string,
      element: HTMLElement,
      shouldUpdateScroll: ShouldUpdateElementScroll<PrevContext, Context>,
      context: Context,
    ) => void

    unregisterElement: (key: string) => void

    scrollToTarget: (element: HTMLElement, target: ScrollTarget) => void
  }
}
