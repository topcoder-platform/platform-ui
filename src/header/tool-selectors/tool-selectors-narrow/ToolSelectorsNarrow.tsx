import classNames from 'classnames'
import { Dispatch, FC, SetStateAction, useContext, useState } from 'react'

import { IconOutline, RouteContext, RouteContextData } from '../../../lib'

import { ToolSelectorNarrow } from './tool-selector-narrow'
import styles from './ToolSelectorsNarrow.module.scss'

const ToolSelectorsNarrow: FC<{}> = () => {

    const { routes }: RouteContextData = useContext(RouteContext)
    const [isOpen, setIsOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(false as boolean)

    const closed: JSX.Element = <IconOutline.MenuIcon />
    const open: JSX.Element = (
        <>
            <IconOutline.XIcon />
            {routes
                .filter(route => route.enabled)
                .map(selector => <ToolSelectorNarrow route={selector.route} title={selector.title} key={selector.title} />)}
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
