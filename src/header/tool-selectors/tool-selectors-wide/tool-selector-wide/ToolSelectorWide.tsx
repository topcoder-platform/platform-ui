import classNames from 'classnames'
import { FC } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { PlatformRoute, routeIsActive } from '../../../../lib'
import '../../../../lib/styles/index.scss'

import styles from './ToolSelectorWide.module.scss'

interface ToolSelectorWideProps {
    route: PlatformRoute
}

const ToolSelectorWide: FC<ToolSelectorWideProps> = (props: ToolSelectorWideProps) => {

    const { route, title }: PlatformRoute = props.route

    const isActive: boolean = routeIsActive(useLocation().pathname, route)
    const activeIndicaterClass: string = `tool-selector-wide-${isActive ? '' : 'in'}active`

    return (
        <div className={classNames(styles['tool-selector-wide'], styles[activeIndicaterClass])}>
            <Link
                className='large-tab'
                tabIndex={-1}
                to={route} 
            >
                {title}
            </Link>
            <div className={styles['active-indicator']}></div>
        </div>
    )
}

export default ToolSelectorWide
