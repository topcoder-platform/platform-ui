import { FC, useMemo } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { LoadingSpinner } from '~/libs/ui'

import { fetchContentfulEntry } from '../../../lib/services'
import { useCommunityContext } from '../CommunityContext'

interface CommunityPageRouteState {
    contentfulId?: string
    spaceName?: string
}

interface CommunityPageMetaConfig {
    contentfulId?: string
    spaceName?: string
}

interface CommunityMetadataPages {
    [slug: string]: CommunityPageMetaConfig
}

/**
 * Reads a string value from Contentful-style localized field values.
 *
 * @param value Field value.
 * @returns First available string value.
 */
function readString(value: unknown): string | undefined {
    if (typeof value === 'string') {
        return value
    }

    if (!value || typeof value !== 'object') {
        return undefined
    }

    return Object.values(value as Record<string, unknown>)
        .find(item => typeof item === 'string') as string | undefined
}

/**
 * Resolves page slug from current location and community route params.
 *
 * @param pathname Current pathname.
 * @param communityId Active community id.
 * @returns Page slug key for metadata lookup.
 */
function resolvePageSlug(pathname: string, communityId?: string): string {
    if (!communityId) {
        return 'home'
    }

    const segments = pathname.replace(/\/+$/, '')
        .split('/')
        .filter(Boolean)
    const communitySegmentIndex = segments.findIndex(segment => segment === communityId)
    const pageSlug = communitySegmentIndex >= 0
        ? segments[communitySegmentIndex + 1]
        : undefined

    return pageSlug ?? 'home'
}

/**
 * Renders a Contentful entry payload for community content pages.
 *
 * @param entry Contentful entry payload.
 * @returns Rendered page content.
 */
function renderContent(entry: unknown): JSX.Element {
    if (!entry || typeof entry !== 'object') {
        return (
            <p>
                No content available for this page.
            </p>
        )
    }

    const record = entry as Record<string, unknown>
    const fields = record.fields as Record<string, unknown> | undefined
    const title = readString(fields?.title) ?? readString(fields?.name)
    const content = readString(fields?.content)
        ?? readString(fields?.body)
        ?? readString(fields?.description)
        ?? readString(fields?.text)

    if (!content) {
        return (
            <pre>
                {JSON.stringify(entry, undefined, 2)}
            </pre>
        )
    }

    return (
        <article>
            {title && <h1>{title}</h1>}
            <div dangerouslySetInnerHTML={{ __html: content }} />
        </article>
    )
}

/**
 * Generic Contentful-driven community page renderer.
 *
 * @returns Community page content from Contentful metadata configuration.
 */
const CommunityContentPage: FC = () => {
    const location = useLocation()
    const { communityId }: { communityId?: string } = useParams<{ communityId: string }>()
    const routeState = location.state as CommunityPageRouteState | undefined
    const communityContext = useCommunityContext()
    const pageSlug = useMemo(
        () => resolvePageSlug(location.pathname, communityId),
        [communityId, location.pathname],
    )
    const pageConfigFromMeta = useMemo<CommunityPageMetaConfig | undefined>(() => {
        const metadata = communityContext?.meta.metadata as Record<string, unknown> | undefined
        const pages = metadata?.pages as CommunityMetadataPages | undefined
        if (!pages) {
            return undefined
        }

        return pages[pageSlug]
    }, [communityContext?.meta.metadata, pageSlug])
    const contentfulId = routeState?.contentfulId ?? pageConfigFromMeta?.contentfulId
    const spaceName = routeState?.spaceName
        ?? pageConfigFromMeta?.spaceName
        ?? EnvironmentConfig.CONTENTFUL.SPACE_ID

    const {
        data,
        error,
        isValidating: isLoading,
    }: SWRResponse<unknown, Error> = useSWR<unknown, Error>(
        `community/contentful-entry/${spaceName}/${contentfulId}`,
        {
            fetcher: () => fetchContentfulEntry(contentfulId ?? '', spaceName),
            isPaused: () => !contentfulId,
        },
    )

    if (!contentfulId) {
        return (
            <section>
                <p>No Contentful entry is configured for this page.</p>
            </section>
        )
    }

    if (isLoading) {
        return <LoadingSpinner />
    }

    if (error) {
        return (
            <section>
                <p>Unable to load community page content right now.</p>
            </section>
        )
    }

    return (
        <section>
            {renderContent(data)}
        </section>
    )
}

export default CommunityContentPage
