import classNames from 'classnames'
import { FC, useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { IconOutline, PlatformRoute, routeContext, RouteContextData, routeIsActiveTool } from '../../../../lib'

import styles from './ToolSelectorNarrow.module.scss'

interface ToolSelectorNarrowProps {
    route: PlatformRoute
}

const isParamRoute: (route: string) => boolean = (route: string) => !!route.match(/^:[^/]+$/)

const ToolSelectorNarrow: FC<ToolSelectorNarrowProps> = (props: ToolSelectorNarrowProps) => {

    const {
        getPathFromRoute,
    }: RouteContextData = useContext(routeContext)

    const toolRoute: PlatformRoute = props.route
    const toolPath: string = getPathFromRoute(toolRoute)
    const baseClass: string = 'tool-selector-narrow'
    const isActive: boolean = routeIsActiveTool(useLocation().pathname, toolRoute)
    const activeIndicaterClass: string = `${baseClass}-${isActive ? '' : 'in'}active`
    const hasChildren: boolean = !!toolRoute.children?.some(child => !!child.route && !isParamRoute(child.route))

    return (
        <div className={styles[baseClass]}>
            <Link
                className={classNames(styles[`${baseClass}-link`], styles[activeIndicaterClass])}
                key={toolPath}
                to={toolPath}
            >
                {toolRoute.title}
                {hasChildren && <IconOutline.ChevronRightIcon />}
            </Link>
        </div>
    )
}

export default ToolSelectorNarrow
