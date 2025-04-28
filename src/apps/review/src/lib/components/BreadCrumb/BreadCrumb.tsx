import { FC } from 'react'
import { Link } from 'react-router-dom'

import { BreadCrumbData } from '../../models'

import styles from './BreadCrumb.module.scss'

interface Props {
    list: BreadCrumbData[]
}

export const BreadCrumb: FC<Props> = (props: Props) => (
    <div className={styles.breadcrumb}>
        <ul>
            {props.list.map(item => (
                <li key={item.index}>
                    {item.path ? (
                        <Link to={item.path as string}>{item.label}</Link>
                    ) : (
                        <span>{item.label}</span>
                    )}
                </li>
            ))}
        </ul>
    </div>
)

export default BreadCrumb
