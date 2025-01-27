import * as React from 'react'

import { TOC } from './markdownRenderer'
import TableOfContents from './TableOfContents'
import styles from './LayoutDoc.module.scss'

interface LayoutDocProps {
    children: React.ReactNode
    disableToc: boolean
    toc: TOC
}

export const LayoutDoc: React.FC<LayoutDocProps> = props => (
    <main className={styles.main}>
        <div
            className={`${styles.mainContent} ${
                props.disableToc ? styles.disableToc : ''
            }`}
        >
            {props.children}
        </div>
        {props.disableToc ? undefined : <TableOfContents toc={props.toc} />}
    </main>
)

export default LayoutDoc
