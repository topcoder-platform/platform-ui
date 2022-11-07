import * as React from 'react'

import styles from './LayoutDoc.module.scss'
import { TOC } from './markdownRenderer'
import TableOfContents from './TableOfContents'

interface LayoutDocProps {
    children: React.ReactNode
    disableToc: boolean
    toc: TOC
}

export const LayoutDoc: React.FC<LayoutDocProps> = (props) => {
    const { children, toc, disableToc }: LayoutDocProps = props

    return (
        <main className={styles.main}>
            <div
                className={`${styles.mainContent} ${
                    disableToc ? styles.disableToc : ''
                }`}
            >
                {children}
            </div>
            {disableToc ? undefined : <TableOfContents toc={toc} />}
        </main>
    )
}

export default LayoutDoc
