import classNames from 'classnames'
import { FC } from 'react'
import { Link, NavigateFunction, useLocation, useNavigate } from 'react-router-dom'

import { RouteConfig } from '../../../config'
import { MenuIcon, XIcon } from '../../../lib'

import styles from './ToolSelectorsNarrow.module.scss'

const ToolSelectorsNarrow: FC<{}> = () => {

    const routes: RouteConfig = new RouteConfig()
    const isOpened: boolean = routes.isToolsSelection(useLocation().pathname)
    const selectorsStyles: string = classNames(styles[`tool-selectors-narrow-${isOpened ? 'opened' : 'closed'}`], 'font-tc-white')
    const navigate: NavigateFunction = useNavigate()

    const closedToolSelectorsNarrow: JSX.Element = (
        <Link to={routes.toolSelectors} className={selectorsStyles}>
            <MenuIcon />
        </Link>
    )

    const openedToolSelectorsNarrow: JSX.Element = (
        /* TODO: convert this to a button so that it doesn't require an href for accessibility */
        <a onClick={() => navigate(-1)} className={selectorsStyles}>
            <XIcon />
        </a>
    )

    return isOpened ? openedToolSelectorsNarrow : closedToolSelectorsNarrow
}

export default ToolSelectorsNarrow
