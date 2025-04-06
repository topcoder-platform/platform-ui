/**
 * Type for common request
 */

export type RequestCommonDataType = {
    [key: string]:
        | string
        | number
        | Date
        | undefined
        | null
        | {
              id: number
          }
}
