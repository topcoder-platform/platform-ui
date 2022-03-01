import classNames from 'classnames'
import { FC } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { SectionSelectorProps } from '../../../interfaces'
import { UiRoute } from '../../../urls'

import styles from './Section-Selector.module.scss'

const SectionSelector: FC<SectionSelectorProps> = (props: SectionSelectorProps) => {

    const routes: UiRoute = new UiRoute()
    const isActive: boolean = routes.isActive(useLocation().pathname, props.route)

    return (
        <Link to={props.route}>
            <div className={styles['section-selector']}>
                <img src={props.icon}></img>
                <div className={classNames(styles.title, isActive ? styles.active : '')}>
                    {props.title}
                </div>
            </div>
        </Link>
    )
}

export default SectionSelector
