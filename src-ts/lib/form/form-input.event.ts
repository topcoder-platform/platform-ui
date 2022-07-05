export type EventName = 'onBlur' | 'onChange' | 'onFocus'

export interface InputEvent {
  readonly event: (value: string) => void
  readonly name: EventName
}