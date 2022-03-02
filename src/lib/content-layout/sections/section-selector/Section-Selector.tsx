import classNames from 'classnames'
import { FC } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { RouteConfig } from '../../../../config'

import { SectionSelectorProps } from './section-selector-props.model'
import styles from './Section-Selector.module.scss'

const SectionSelector: FC<SectionSelectorProps> = (props: SectionSelectorProps) => {

    const routes: RouteConfig = new RouteConfig()
    const isActive: boolean = routes.isActive(useLocation().pathname, props.route)

    return (
        <Link to={props.route}>
            <div className={styles['section-selector']}>
                <img src={props.icon} alt={props.title} />
                <div className={classNames(styles.title, isActive ? styles.active : '')}>
                    {props.title}
                </div>
            </div>
        </Link>
    )
}

export default SectionSelector
