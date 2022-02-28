import { FC } from 'react'
import { useLocation } from 'react-router-dom'

import '../../../lib/styles/index.scss'
import { UiRoute } from '../../../lib/urls'

import styles from './Tool-Selector.module.scss'

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
            <a href={props.url} className='large-tab'>
                {props.name}
            </a>
            <div className={styles[activeIndicaterClass]}></div>
        </div>
    )
}

export default ToolSelector
