/**
 * Model for table column config on mobile
 */
import { TableColumn } from '~/libs/ui'

export interface MobileTableColumn<T> extends TableColumn<T> {
    readonly mobileType?: 'label'
}
