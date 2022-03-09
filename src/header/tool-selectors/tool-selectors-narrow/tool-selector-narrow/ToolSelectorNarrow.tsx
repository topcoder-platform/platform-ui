import classNames from 'classnames'
import { FC } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { RouteConfig } from '../../../../config'
import { IconOutline } from '../../../../lib'
import { toolSelectorsRoutes } from '../../tool-selectors-routes.config'

import styles from './ToolSelectorNarrow.module.scss'

const ToolSelectorNarrow: FC<{}> = () => {

    const activeRoute: string = useLocation().pathname
    const baseClass: string = 'tool-selector-narrow'
    const routes: RouteConfig = new RouteConfig()

    const toolSelectorElements: Array<JSX.Element> = toolSelectorsRoutes
        .map(selector => {

            const isActive: boolean = routes.isActive(activeRoute, selector.route)
            const activeIndicaterClass: string = `${baseClass}-${isActive ? '' : 'in'}active`

            return (
                <Link
                    className={classNames(styles[`${baseClass}-link`], styles[activeIndicaterClass])}
                    key={selector.route}
                    to={selector.route}
                >
                    {selector.title}
                    <IconOutline.ChevronRightIcon />
                </Link>
            )
        })

    return (
        <div className={styles[baseClass]}>
            {toolSelectorElements}
        </div>
    )
}

export default ToolSelectorNarrow
