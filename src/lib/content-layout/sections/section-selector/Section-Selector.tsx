import classNames from 'classnames'
import { FC, SVGProps } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { routeIsActive } from '../../../route-provider/route.utils' // cannot be imported from barrel

import { SectionSelectorProps } from './section-selector-props.model'
import styles from './Section-Selector.module.scss'

const SectionSelector: FC<SectionSelectorProps> = (props: SectionSelectorProps) => {

    const sectionRoute: string = `${props.toolRoute}${props.sectionRoute.route ? '/' : ''}${props.sectionRoute.route}`
    const isActive: boolean = routeIsActive(useLocation().pathname, sectionRoute, props.toolRoute)
    const Icon: FC<SVGProps<SVGSVGElement>> | undefined = props.sectionRoute.icon

    return (
        <Link to={props.sectionRoute.route}>
            <div className={classNames(styles['section-selector'], isActive ? styles.active : '')}>
                {Icon && <Icon />}
                <div className={styles.title}>
                    {props.sectionRoute.title}
                </div>
            </div>
        </Link>
    )
}

export default SectionSelector
