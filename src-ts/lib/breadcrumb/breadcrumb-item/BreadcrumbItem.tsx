import { FC } from 'react'
import { Link } from 'react-router-dom'

import styles from '../Breadcrumb.module.scss'

import { BreadcrumbItemModel } from './breadcrumb-item.model'

interface BreadcrumbItemProps {
    index: number
    item: BreadcrumbItemModel
}

const BreadcrumbItem: FC<BreadcrumbItemProps> = (props: BreadcrumbItemProps) => {

    function onClick(): void {
        props.item.onClick?.(props.item)
    }

    return (
        <li
            key={props.index}
            onClick={onClick}
            className={props.item.isElipsis ? 'elipsis' : ''}
        >
            <Link
                className={props.item.isElipsis ? styles.elipsis : ''}
                to={props.item.url}
            >
                {props.item.name}
            </Link>
        </li>
    )
}

export default BreadcrumbItem
