import { TableCellType } from './table-cell.type'

export interface TableColumn<T> {
    readonly defaultSortDirection?: 'asc' | 'desc'
    readonly isDefaultSort?: boolean
    readonly label?: string
    readonly propertyName?: string
    readonly renderer?: (data: T, params?: any) => JSX.Element | undefined
    readonly tooltip?: string
    readonly type: TableCellType
}
