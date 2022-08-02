import * as React from 'react'

import { IconSolid, useWindowSize } from '../../../../lib'
import { Breakpoints } from '../../../../lib/styles'

import styles from './MarkdownAccordion.module.scss'

interface MarkdownAccordionProps {
    children: React.ReactNode
}

export const MarkdownAccordion: React.FC<MarkdownAccordionProps> = (props) => {
    const { children: childrenProp }: MarkdownAccordionProps = props

    const [collapsed, setCollapsed]: [
        boolean,
        React.Dispatch<React.SetStateAction<boolean>>
    ] = React.useState<boolean>(false)
    const size: ReturnType<typeof useWindowSize> = useWindowSize()

    if (size && size.width > Breakpoints.lgMax) {
        return <>{childrenProp}</>
    }

    const [header, ...children]: ReturnType<typeof React.Children.toArray> =
        React.Children.toArray(childrenProp)
    return (
        <div className={`${styles['accordion']}`}>
            <div
                className={`${styles['pane-outline']}`}
                onClick={() => {
                    if (React.isValidElement(header)) {
                        setCollapsed(!collapsed)
                    }
                }}
            >
                {header}
                {collapsed ? (
                    <IconSolid.ChevronDownIcon />
                ) : (
                    <IconSolid.ChevronUpIcon />
                )}
            </div>

            {!collapsed && children}
        </div>
    )
}

export default MarkdownAccordion
