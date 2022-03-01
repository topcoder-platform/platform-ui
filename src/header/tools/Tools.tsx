import { FC } from 'react'

import { UiRoute } from '../../lib/urls'

import ToolSelector from './tool-selector/ToolSelector'
import styles from './Tools.module.scss'

const Tools: FC<{}> = () => {

    const routes: UiRoute = new UiRoute()

    return (
        <>
            <div className={styles.tools}>
                {/* TODO: make this configurable */}
                <ToolSelector name='Home' url={routes.home} />
                <ToolSelector name='Design Library' url={routes.designLib} />
                <ToolSelector name='Self Service' url={routes.selfService} />
                <ToolSelector name='Tool' url={routes.tool} />
            </div>
        </>
    )
}

export default Tools
