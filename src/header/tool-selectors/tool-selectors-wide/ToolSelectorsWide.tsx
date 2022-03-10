import { FC, useContext } from 'react'

import { RouteContext, RouteContextData } from '../../../lib'

import { ToolSelectorWide } from './tool-selector-wide'
import styles from './ToolSelectorsWide.module.scss'

const ToolSelectorsWide: FC<{}> = () => {

    const { toolsRoutes }: RouteContextData = useContext(RouteContext)

    const selectors: Array<JSX.Element> = toolsRoutes
        .map(route => <ToolSelectorWide key={route.title} route={route} />)

    return (
        <>
            <div className={styles['tool-selectors-wide']}>
                {selectors}
            </div>
        </>
    )
}

export default ToolSelectorsWide
