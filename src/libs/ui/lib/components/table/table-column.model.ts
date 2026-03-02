import { TableCellType } from './table-cell.type'

export interface TableColumn<T> {
    readonly defaultSortDirection?: 'asc' | 'desc'
    readonly isDefaultSort?: boolean
    readonly label?: string | (() => JSX.Element)
    readonly propertyName?: string
    readonly className?: string
    readonly renderer?: (data: T, params?: any) => JSX.Element | undefined
    readonly tooltip?: string
    readonly isExpand?: boolean
    readonly colSpan?: number
    /** When set, the cell spans this many rows. Rows below will skip this column. */
    readonly rowSpan?: (row: T, rowIndex: number, allRows: ReadonlyArray<T>) => number | undefined
    readonly type: TableCellType
    readonly isSortable?: boolean
    readonly columnId?: string
    readonly mobileColSpan?: number
}
