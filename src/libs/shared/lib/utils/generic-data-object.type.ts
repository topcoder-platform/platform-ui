export type GenericDataObject<T = string> = { [key: string]: GenericDataObject | T }
