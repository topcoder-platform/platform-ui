export enum EventName {
  ON_BLUR = 'ON_BLUR',
  ON_CHANGE = 'ON_CHANGE',
  ON_FOCUS = 'ON_FOCUS',
}

export interface InputEvent {
  readonly name: EventName
  readonly event: (value: string) => void
}