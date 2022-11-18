import { Dispatch, FC, SetStateAction, useContext, useState } from 'react'
import classNames from 'classnames'

import { IconOutline, routeContext, RouteContextData } from '../../../lib'

import { ToolSelectorNarrow } from './tool-selector-narrow'
import styles from './ToolSelectorsNarrow.module.scss'

const ToolSelectorsNarrow: FC<{}> = () => {

    const { toolsRoutesForNav }: RouteContextData = useContext(routeContext)
    const [isOpen, setIsOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const toolSelectors: Array<JSX.Element> = toolsRoutesForNav
        .map(route => (
            <ToolSelectorNarrow
                key={route.title}
                route={route}
            />
        ))

    const closed: JSX.Element = <IconOutline.MenuIcon />

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
