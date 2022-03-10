import classNames from 'classnames'
import { Dispatch, FC, SetStateAction, useContext, useState } from 'react'

import { IconOutline, RouteContext, RouteContextData } from '../../../lib'

import { ToolSelectorNarrow } from './tool-selector-narrow'
import styles from './ToolSelectorsNarrow.module.scss'

const ToolSelectorsNarrow: FC<{}> = () => {

    const { toolsRoutes, utilsRoutes }: RouteContextData = useContext(RouteContext)
    const [isOpen, setIsOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const closed: JSX.Element = <IconOutline.MenuIcon />
    const toolSelectors: Array<JSX.Element> = [
        ...utilsRoutes,
        ...toolsRoutes,
    ]
        .map(selector => <ToolSelectorNarrow route={selector.route} title={selector.title} key={selector.title} />)

    const open: JSX.Element = (
        <>
            <IconOutline.XIcon />
            <div className={styles['tool-selectors-narrow-container']}>
                {toolSelectors}
            </div>
        </>
    )

    return (
        <div
            className={classNames(styles['tool-selectors-narrow'], 'font-tc-white')}
            onClick={() => setIsOpen(!isOpen)}
        >
            {isOpen ? open : closed}
        </div>
    )
}

export default ToolSelectorsNarrow
