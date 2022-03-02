import { FC } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { UiRoute } from '../../../../lib'
import '../../../../lib/styles/index.scss'
import { ToolSelectorProps } from '../../models'

import styles from './ToolSelectorWide.module.scss'

const ToolSelectorWide: FC<ToolSelectorProps> = (props: ToolSelectorProps) => {

    const uiRoutes: UiRoute = new UiRoute()

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
