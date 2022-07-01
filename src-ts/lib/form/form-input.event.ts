export type EventName = 'onBlur' | 'onChange' | 'onFocus'

export interface InputEvent {
  readonly name: EventName
  readonly event: (value: string) => void
}