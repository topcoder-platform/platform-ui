import { FC, SVGProps } from 'react'

import { Sort } from '../../../../../../apps/gamification-admin/src/game-lib/pagination'
import { IconOutline } from '../../svgs'
import { Button } from '../../button'

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

    function handleClick(): void {
        props.toggleSort(props.propertyName as string)
    }

    return (
        <Button
            className={props.iconClass}
            icon={icon}
            onClick={handleClick}
            size='sm'
        />
    )
}

export default TableSort
