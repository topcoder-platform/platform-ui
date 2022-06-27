import { Sort } from './sort.model'

export interface Page {
    number: number // this is a page number, not a page index; therefore, it starts at 1
    size: number
    sort: Sort
}
