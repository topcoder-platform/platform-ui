import * as React from 'react'

import { CopyButton } from '../CopyButton'

import styles from './MarkdownLink.module.scss'

interface MarkdownLinkProps {
    children: React.ReactNode
    href: string
}

export const MarkdownLink: React.FC<MarkdownLinkProps> = props => {
    const { children, href }: MarkdownLinkProps = props
    return (
        <div className={styles.linkBlock}>
            <span className={styles.label}>LINK</span>
            <span className={styles.divider} />
            <span className={styles.link}>{children}</span>
            <CopyButton text={href} />
        </div>
    )
}

export default MarkdownLink
