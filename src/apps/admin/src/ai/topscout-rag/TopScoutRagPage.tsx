/**
 * TopScout RAG Management — trigger ingestion runs into TopScout's vector
 * index, and manage which Topcoder challenges are currently searchable by the
 * assistant.
 *
 * Both panels talk to tc-ai-api: ingestion through the challenge-ingestion /
 * challenge-bulk-ingestion workflows, the list through its RAG index admin
 * API. Both are administrator-only there as well as here, so a non-admin who
 * reaches this route past the client guard still gets a 403.
 */
import { FC, useCallback, useState } from 'react'

import { PageWrapper } from '../../lib'

import { IndexedChallengesPanel } from './IndexedChallengesPanel'
import { IngestChallengesPanel } from './IngestChallengesPanel'
import styles from './TopScoutRagPage.module.scss'

export const TopScoutRagPage: FC = () => {
    // Bumped after every run so the list refetches — an ingestion run is the
    // one thing on this page that changes what the list should show.
    const [refreshToken, setRefreshToken] = useState(0)

    const handleRunComplete = useCallback(() => {
        setRefreshToken(previous => previous + 1)
    }, [])

    return (
        <PageWrapper
            pageTitle='TopScout RAG Management'
            pageSubTitle={(
                <p className={styles.subtitle}>
                    Trigger ingestion runs into TopScout&apos;s vector index and manage which
                    Topcoder challenges are currently searchable by the assistant.
                </p>
            )}
        >
            <div className={styles.panels}>
                <IngestChallengesPanel onRunComplete={handleRunComplete} />
                <IndexedChallengesPanel refreshToken={refreshToken} />
            </div>
        </PageWrapper>
    )
}

export default TopScoutRagPage
