import { FC } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { RouteConfig } from '../../../../config'
import '../../../../lib/styles/index.scss'
import { ToolSelectorRoute } from '../../tool-selector-route.model'

import styles from './ToolSelectorWide.module.scss'

interface ToolSelectorProps {
    toolSelectorRoute: ToolSelectorRoute
}

const ToolSelectorWide: FC<ToolSelectorProps> = (props: ToolSelectorProps) => {

    const uiRoutes: RouteConfig = new RouteConfig()

    const { route, title }: ToolSelectorRoute = props.toolSelectorRoute

    const isActive: boolean = uiRoutes.isActive(useLocation().pathname, route, uiRoutes.home)
    const activeIndicaterClass: string = `tool-selector-wide-${isActive ? '' : 'in'}active`

    return (
        <div className={styles['tool-selector-wide']}>
            <Link to={route} className='large-tab'>
                {title}
            </Link>
            <div className={styles[activeIndicaterClass]}></div>
        </div>
    )
}

export default ToolSelectorWide
