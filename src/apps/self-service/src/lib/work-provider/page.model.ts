export interface Sort {
    direction: 'asc' | 'desc'
    fieldName: string
}

export interface Page {
    number: number // this is a page number, not a page index; therefore, it starts at 1
    size: number
    sort: Sort
}
