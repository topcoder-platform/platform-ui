import { FC, useMemo } from 'react'

import type { CommunityMeta } from '../../../lib/models'
import { useCommunityContext } from '../CommunityContext'

import styles from './CommunityLeaderboardPage.module.scss'

/**
 * Reads a non-empty string from unknown data.
 *
 * @param value Source value.
 * @returns Normalized string value.
 */
function readString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
        return undefined
    }

    const trimmed = value.trim()
    return trimmed.length > 0
        ? trimmed
        : undefined
}

/**
 * Resolves an embeddable leaderboard URL from community metadata.
 *
 * @param communityMeta Community metadata object.
 * @returns Leaderboard URL when configured.
 */
function resolveLeaderboardUrl(communityMeta?: CommunityMeta): string | undefined {
    const metadata = communityMeta?.metadata as Record<string, unknown> | undefined
    const leaderboardConfig = metadata?.leaderboard as Record<string, unknown> | undefined
    const topLevelUrl = readString(
        (communityMeta as CommunityMeta & { leaderboardApiUrl?: unknown } | undefined)?.leaderboardApiUrl,
    )
    const metadataUrl = readString(metadata?.leaderboardApiUrl)
        ?? readString(leaderboardConfig?.apiUrl)
        ?? readString(leaderboardConfig?.url)

    const candidateUrl = topLevelUrl ?? metadataUrl
    if (!candidateUrl) {
        return undefined
    }

    try {
        const parsedUrl = new URL(candidateUrl)
        return parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:'
            ? parsedUrl.toString()
            : undefined
    } catch {
        return undefined
    }
}

/**
 * Shared leaderboard route page for community routes.
 *
 * @returns Embedded leaderboard view or fallback state.
 */
const CommunityLeaderboardPage: FC = () => {
    const communityContext = useCommunityContext()
    const leaderboardUrl = useMemo(
        () => resolveLeaderboardUrl(communityContext?.meta),
        [communityContext?.meta],
    )

    if (!leaderboardUrl) {
        return (
            <section className={styles.page}>
                <h1 className={styles.title}>Leaderboard</h1>
                <p className={styles.message}>
                    Leaderboard data is not configured for this community.
                </p>
            </section>
        )
    }

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>Leaderboard</h1>
                <a
                    className={styles.link}
                    href={leaderboardUrl}
                    rel='noreferrer'
                    target='_blank'
                >
                    Open leaderboard in a new tab
                </a>
            </header>
            <iframe
                className={styles.frame}
                loading='lazy'
                src={leaderboardUrl}
                title='Community Leaderboard'
            />
        </section>
    )
}

export default CommunityLeaderboardPage
