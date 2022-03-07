import { FC } from 'react'

import { toolSelectorsRoutes } from '../tool-selectors-routes.config'

import ToolSelectorWide from './tool-selector-wide/ToolSelectorWide'
import styles from './ToolSelectorsWide.module.scss'

const ToolSelectorsWide: FC<{}> = () => {

    const selectors: Array<JSX.Element> = toolSelectorsRoutes
        .map(toolSelector => <ToolSelectorWide key={toolSelector.title} toolSelectorRoute={toolSelector} />)

    return (
        <>
            <div className={styles['tool-selectors-wide']}>
                {selectors}
            </div>
        </>
    )
}

export default ToolSelectorsWide
