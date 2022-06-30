export type EventName = 'OnBlur' | 'OnChange' | 'OnFocus'

export interface InputEvent {
  readonly name: EventName
  readonly event: (value: string) => void
}