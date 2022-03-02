import classNames from 'classnames'
import { FC } from 'react'
import { Link, NavigateFunction, useLocation, useNavigate } from 'react-router-dom'

import { UiRoute } from '../../../lib'

import styles from './ToolSelectionsNarrow.module.scss'

const ToolSelectionsNarrow: FC<{}> = () => {

    const routes: UiRoute = new UiRoute()
    const isOpened: boolean = routes.isToolsSelection(useLocation().pathname)
    const selectionStyles: string = classNames(styles[`tool-selections-narrow-${isOpened ? 'opened' : 'closed'}`], 'font-tc-white')
    const navigate: NavigateFunction = useNavigate()

    // TODO: create the menu.svg
    const closedToolSelectionsNarrow: JSX.Element = (
        <Link to={routes.toolSelections} className={selectionStyles}>
            <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <path d='M4 6H20M4 12H20M4 18H20' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
        </Link>
    )

    // TODO: create the x.svg
    const openedToolSelectionsNarrow: JSX.Element = (
        /* TODO: convert this to a button so that it doesn't require an href for accessibility */
        <a onClick={() => navigate(-1)} className={selectionStyles}>
            <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <path d='M6 18L18 6M6 6L18 18' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
        </a>
    )

    return isOpened ? openedToolSelectionsNarrow : closedToolSelectionsNarrow
}

export default ToolSelectionsNarrow
