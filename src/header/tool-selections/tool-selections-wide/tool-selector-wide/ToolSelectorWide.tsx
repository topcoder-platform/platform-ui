import { FC } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { RouteConfig } from '../../../../config'
import '../../../../lib/styles/index.scss'
import { ToolSelectorProps } from '../../models'

import styles from './ToolSelectorWide.module.scss'

const ToolSelectorWide: FC<ToolSelectorProps> = (props: ToolSelectorProps) => {

    const uiRoutes: RouteConfig = new RouteConfig()

    const isActive: boolean = uiRoutes.isActive(useLocation().pathname, props.route)
    const activeIndicaterClass: string = `tool-selector-wide-${isActive ? '' : 'in'}active`

    return (
        <div className={styles['tool-selector-wide']}>
            <Link to={props.route} className='large-tab'>
                {props.title}
            </Link>
            <div className={styles[activeIndicaterClass]}></div>
        </div>
    )
}

export default ToolSelectorWide
