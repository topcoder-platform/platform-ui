import classNames from 'classnames'
import { FC } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { RouteConfig } from '../../../../config'
import { IconOutline } from '../../../../lib'

import styles from './ToolSelectorNarrow.module.scss'

interface ToolSelectorNarrowProps {
    route: string
    title: string
}

const ToolSelectorNarrow: FC<ToolSelectorNarrowProps> = (props: ToolSelectorNarrowProps) => {

    const baseClass: string = 'tool-selector-narrow'
    const isActive: boolean = RouteConfig.isActive(useLocation().pathname, props.route, RouteConfig.home)
    const activeIndicaterClass: string = `${baseClass}-${isActive ? '' : 'in'}active`

    return (
        <div className={styles[baseClass]}>
            <Link
                className={classNames(styles[`${baseClass}-link`], styles[activeIndicaterClass])}
                key={props.route}
                to={props.route}
            >
                {props.title}
                <IconOutline.ChevronRightIcon />
            </Link>
        </div>
    )
}

export default ToolSelectorNarrow
