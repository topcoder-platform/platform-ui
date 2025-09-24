/**
 * Model for table column detail config
 */
import { TableColumn } from '~/libs/ui'

export interface DetailsTableColumn<T> extends TableColumn<T> {
    readonly detailType?: 'label'
}
