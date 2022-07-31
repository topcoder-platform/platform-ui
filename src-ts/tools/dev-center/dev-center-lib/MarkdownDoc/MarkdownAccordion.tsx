import * as React from 'react'

import { useWindowSize } from '../../../../lib'
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

    const [h2, ...children]: ReturnType<typeof React.Children.toArray> =
        React.Children.toArray(childrenProp)
    const header: React.ReactNode = React.isValidElement(h2)
        ? React.cloneElement(h2, { onClick: () => setCollapsed(!collapsed) })
        : h2

    return (
        <div
            className={`${styles['accordion']} ${
                collapsed ? styles['collapsed'] : ''
            }`}
        >
            {header}
            {children}
        </div>
    )
}

export default MarkdownAccordion
