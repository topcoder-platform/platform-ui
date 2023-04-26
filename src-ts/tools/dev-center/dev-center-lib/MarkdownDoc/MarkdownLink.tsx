import * as React from 'react'

import { CopyButton } from '../CopyButton'

import styles from './MarkdownLink.module.scss'

interface MarkdownLinkProps {
    children: React.ReactNode
    href: string
}

export const MarkdownLink: React.FC<MarkdownLinkProps> = props => (
    <div className={styles.linkBlock}>
        <span className={styles.label}>LINK</span>
        <span className={styles.divider} />
        <span className={styles.link}>{props.children}</span>
        <CopyButton text={props.href} />
    </div>
)

export default MarkdownLink
