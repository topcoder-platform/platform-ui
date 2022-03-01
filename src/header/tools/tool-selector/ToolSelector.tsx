import { FC } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { UiRoute } from '../../../lib'
import '../../../lib/styles/index.scss'

import styles from './ToolSelector.module.scss'

interface ToolSelectorProps {
    name: string
    url: string
}

const ToolSelector: FC<ToolSelectorProps> = (props: ToolSelectorProps) => {

    const uiRoutes: UiRoute = new UiRoute()

    const isActive: boolean = uiRoutes.isActive(useLocation().pathname, props.url)
    const activeIndicaterClass: string = `tool-${isActive ? '' : 'in'}active`

    return (
        <div className={styles['tool-selector']}>
            <Link to={props.url} className='large-tab'>
                {props.name}
            </Link>
            <div className={styles[activeIndicaterClass]}></div>
        </div>
    )
}

export default ToolSelector
