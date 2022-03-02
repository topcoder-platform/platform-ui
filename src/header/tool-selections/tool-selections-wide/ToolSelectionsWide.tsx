import { FC } from 'react'

import { toolSelectors } from '../config'

import ToolSelectorWide from './tool-selector-wide/ToolSelectorWide'
import styles from './ToolSelectionsWide.module.scss'

const ToolSelectionsWide: FC<{}> = () => {

    const selectors: Array<JSX.Element> = toolSelectors
        .map(toolSelector => <ToolSelectorWide
            key={toolSelector.title}
            route={toolSelector.route}
            title={toolSelector.title}
        />)

    return (
        <>
            <div className={styles['tool-selections-wide']}>
                {selectors}
            </div>
        </>
    )
}

export default ToolSelectionsWide
