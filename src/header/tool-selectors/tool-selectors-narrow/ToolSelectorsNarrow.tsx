import classNames from 'classnames'
import { Dispatch, FC, SetStateAction, useState } from 'react'

import { ToolSelectorNarrow } from '..'
import { MenuIcon, XIcon } from '../../../lib'

import styles from './ToolSelectorsNarrow.module.scss'

const ToolSelectorsNarrow: FC<{}> = () => {

    const [isOpen, setIsOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const closed: JSX.Element = <MenuIcon />
    const open: JSX.Element = (
        <>
            <XIcon />
            <ToolSelectorNarrow />
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
