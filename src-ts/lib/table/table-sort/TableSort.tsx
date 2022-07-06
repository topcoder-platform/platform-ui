import { FC, SVGProps } from 'react'

import { Button } from '../../button'
import { Sort } from '../../pagination'
import { IconOutline } from '../../svgs'

interface TableSortProps {
    iconClass: string
    isCurrentlySorted: boolean
    propertyName?: string
    sort?: Sort
    toggleSort: (fieldName: string) => void
}

const TableSort: FC<TableSortProps> = (props: TableSortProps) => {

    if (!props.propertyName || !props.sort) {
        return <></>
    }

    // if this isn't the currently sorted field,
    // use the disambiguated icon
    const icon: FC<SVGProps<SVGSVGElement>> = !props.isCurrentlySorted
        ? IconOutline.SwitchVerticalIcon
        : props.sort.direction === 'asc' ? IconOutline.SortAscendingIcon : IconOutline.SortDescendingIcon

    return (
        <Button
            buttonStyle='icon'
            className={props.iconClass}
            icon={icon}
            onClick={() => props.toggleSort(props.propertyName as string)}
            size='sm'
        />
    )
}

export default TableSort
