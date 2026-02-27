import { FC, ReactNode } from 'react'

import { CommunityMeta } from '../../models'
import { CommunityHeader } from '../CommunityHeader'

import styles from './CommunityLayout.module.scss'

interface CommunityLayoutProps {
    baseUrl?: string
    children: ReactNode
    meta: CommunityMeta
}

/**
 * Extracts footer text from a community metadata blob.
 *
 * @param metadata Arbitrary community metadata.
 * @returns Footer text when configured.
 */
function getFooterText(metadata: Record<string, unknown>): string | undefined {
    const footerText = metadata.footerText
    return typeof footerText === 'string' && footerText.trim()
        ? footerText
        : undefined
}

/**
 * Community shell that renders metadata-driven branding, navigation and route content.
 *
 * @param props Community metadata, community route base URL and nested route content.
 * @returns Header/content/footer community layout.
 */
const CommunityLayout: FC<CommunityLayoutProps> = (props: CommunityLayoutProps) => {
    const footerText = getFooterText(props.meta.metadata)
        ?? '© Topcoder. All rights reserved.'

    return (
        <div className={styles.layout}>
            <CommunityHeader
                baseUrl={props.baseUrl}
                meta={props.meta}
            />

            <main className={styles.content}>
                {props.children}
            </main>

            <footer className={styles.footer}>
                {footerText}
            </footer>
        </div>
    )
}

export default CommunityLayout
