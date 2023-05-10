import {
    Children,
    Dispatch,
    FC, isValidElement, ReactNode, SetStateAction, useState,
} from 'react'

import { Breakpoints, IconSolid } from '~/libs/ui'
import { useWindowSize } from '~/libs/shared'

import styles from './MarkdownAccordion.module.scss'

interface MarkdownAccordionProps {
    children: ReactNode
}

export const MarkdownAccordion: FC<MarkdownAccordionProps> = props => {

    const [collapsed, setCollapsed]: [
        boolean,
        Dispatch<SetStateAction<boolean>>
    ] = useState<boolean>(false)
    const size: ReturnType<typeof useWindowSize> = useWindowSize()

    if (size && size.width > Breakpoints.lgMax) {
        return <>{props.children}</>
    }

    const [header, ...childs]: ReturnType<typeof Children.toArray>
        = Children.toArray(props.children)

    function handleClickOutline(): void {
        if (isValidElement(header)) {
            setCollapsed(!collapsed)
        }
    }

    return (
        <div className={`${styles.accordion}`}>
            <div
                className={`${styles['pane-outline']}`}
                onClick={handleClickOutline}
            >
                {header}
                {collapsed ? (
                    <IconSolid.ChevronDownIcon />
                ) : (
                    <IconSolid.ChevronUpIcon />
                )}
            </div>

            {!collapsed && childs}
        </div>
    )
}

export default MarkdownAccordion
