import { FC, SVGProps } from 'react'
import classNames from 'classnames'

import { Sort } from '../../../../../../apps/gamification-admin/src/game-lib/pagination'
import { IconOutline } from '../../svgs'
import { Button } from '../../button'

interface TableSortProps {
    iconClass: string
    isCurrentlySorted: boolean
    propertyName?: string
    sort?: Sort
    toggleSort: (fieldName: string) => void
    removeDefaultSort?: boolean
}

const TableSort: FC<TableSortProps> = (props: TableSortProps) => {
    if (!props.propertyName || (!props.sort && !props.removeDefaultSort)) {
        return <></>
    }

    // if this isn't the currently sorted field,
    // use the disambiguated icon
    const icon: FC<SVGProps<SVGSVGElement>>
        = !props.isCurrentlySorted || !props.sort
            ? IconOutline.SwitchVerticalIcon
            : props.sort.direction === 'asc'
                ? IconOutline.SortAscendingIcon
                : IconOutline.SortDescendingIcon

    function handleClick(): void {
        props.toggleSort(props.propertyName as string)
    }

    return (
        <Button
            className={classNames(props.iconClass, 'TableSort')}
            icon={icon}
            onClick={handleClick}
            size='sm'
        />
    )
}

export default TableSort
