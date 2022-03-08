import classNames from 'classnames'
import { FC, SVGProps } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { RouteConfig } from '../../../../config'

import { SectionSelectorProps } from './section-selector-props.model'
import styles from './Section-Selector.module.scss'

const SectionSelector: FC<SectionSelectorProps> = (props: SectionSelectorProps) => {

    const routes: RouteConfig = new RouteConfig()
    const isActive: boolean = routes.isActive(useLocation().pathname, props.route, props.rootRoute)

    const Icon: FC<SVGProps<SVGSVGElement>> = props.icon

    return (
        <Link to={props.route}>
            <div className={classNames(styles['section-selector'], isActive ? styles.active : '')}>
                <Icon />
                <div className={styles.title}>
                    {props.title}
                </div>
            </div>
        </Link>
    )
}

export default SectionSelector
