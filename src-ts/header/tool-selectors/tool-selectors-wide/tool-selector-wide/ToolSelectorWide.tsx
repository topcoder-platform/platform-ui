import classNames from 'classnames'
import { FC, useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'

import {
    PlatformRoute,
    routeContext,
    RouteContextData,
    routeIsActiveTool,
} from '../../../../lib'
import '../../../../lib/styles/index.scss'

import styles from './ToolSelectorWide.module.scss'

interface ToolSelectorWideProps {
    route: PlatformRoute
}

const ToolSelectorWide: FC<ToolSelectorWideProps> = (props: ToolSelectorWideProps) => {

    const {
        getPathFromRoute,
        isRootRoute,
    }: RouteContextData = useContext(routeContext)

    const activePath: string = useLocation().pathname
    const toolRoute: PlatformRoute = props.route
    const toolPath: string = getPathFromRoute(toolRoute)
    const baseClass: string = 'tool-selector-wide'
    const isActive: boolean = routeIsActiveTool(activePath, toolRoute)
    const activeIndicatorClass: string = `${baseClass}-${isActive ? '' : 'in'}active`

    // the tool link should be usable for all active routes except the home page
    const isLink: boolean = isActive && !isRootRoute(activePath)

    return (
        <div className={classNames(
            styles[baseClass],
            styles[activeIndicatorClass],
            isLink ? styles['tool-selector-wide-is-link'] : undefined
        )}>
            <Link
                className='large-tab'
                tabIndex={-1}
                to={toolPath}
            >
                {toolRoute.title}
            </Link>
            <div className={styles['active-indicator']} />
        </div>
    )
}

export default ToolSelectorWide
