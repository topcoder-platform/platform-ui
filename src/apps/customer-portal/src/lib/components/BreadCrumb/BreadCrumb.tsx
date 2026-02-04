import { FC } from 'react'
import { Link } from 'react-router-dom'

import { BreadCrumbData } from '../../models'
import { useAppNavigate } from '../../hooks'

import styles from './BreadCrumb.module.scss'

interface Props {
    list: BreadCrumbData[]
}

export const BreadCrumb: FC<Props> = (props: Props) => {
    const navigate = useAppNavigate()
    return (
        <div className={styles.breadcrumb}>
            <ul>
                {props.list.map(item => (
                    <li key={item.index}>
                        {item.path ? (
                            item.fallback ? (
                                <button
                                    type='button'
                                    onClick={function onClick() {
                                        navigate(item.path as number, {
                                            fallback: item.fallback,
                                        })
                                    }}
                                >
                                    {item.label}
                                </button>
                            ) : (
                                <Link to={item.path as string}>
                                    {item.label}
                                </Link>
                            )
                        ) : (
                            <span>{item.label}</span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default BreadCrumb
