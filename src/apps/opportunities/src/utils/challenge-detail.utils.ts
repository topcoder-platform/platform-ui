import { EnvironmentConfig } from '~/config'
import { getSafeCmsLink } from '~/libs/cms'

import {
    ChallengeMetadata,
    ChallengeOpportunity,
} from '../models'

export interface ChallengeSidebarLink {
    label: string
    url: string
}

/**
 * Builds a member profile URL on the environment-specific Profiles app.
 *
 * @param handle public Topcoder handle.
 * @param profileBaseUrl configured Profiles app origin, optionally overridden by tests.
 * @returns absolute, safely encoded member profile URL.
 * @throws Does not throw.
 */
export function memberProfileUrl(
    handle: string,
    profileBaseUrl: string = EnvironmentConfig.URLS.USER_PROFILE,
): string {
    return `${profileBaseUrl.replace(/\/+$/, '')}/${encodeURIComponent(handle)}`
}

/**
 * Returns a case-insensitive Challenge API metadata value.
 *
 * @param metadata arbitrary metadata list from Challenge API.
 * @param name recognized metadata name.
 * @returns the first matching raw value, or undefined.
 * @throws Does not throw.
 */
export function challengeMetadataValue(
    metadata: ChallengeMetadata[] | undefined,
    name: string,
): unknown {
    const normalizedName = name.trim()
        .toLowerCase()
    return metadata?.find(item => item.name.trim()
        .toLowerCase() === normalizedName)?.value
}

/**
 * Parses the legacy file-types metadata into unique member-facing labels.
 *
 * @param challenge raw Challenge API detail response.
 * @returns trimmed file types, or an empty list for malformed metadata.
 * @throws Does not throw.
 */
export function challengeFileTypes(challenge: ChallengeOpportunity): string[] {
    const raw = challengeMetadataValue(challenge.metadata, 'fileTypes')
    try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (!Array.isArray(parsed)) return []
        const seen = new Set<string>()
        return parsed.reduce<string[]>((result, item) => {
            if (typeof item !== 'string' || !item.trim()) return result
            const value = item.trim()
            const key = value.toLowerCase()
            if (!seen.has(key)) {
                seen.add(key)
                result.push(value)
            }

            return result
        }, [])
    } catch (error) {
        return []
    }
}

/**
 * Converts an arbitrary value to a positive integer.
 *
 * @param value candidate numeric value.
 * @returns a positive integer, or undefined for invalid/unlimited values.
 * @throws Does not throw.
 */
function positiveInteger(value: unknown): number | undefined {
    const numericValue = Number(value)
    return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : undefined
}

/**
 * Reads the legacy submission-limit metadata contract.
 *
 * @param challenge raw Challenge API detail response.
 * @returns positive configured limit, or undefined for unlimited/malformed data.
 * @throws Does not throw.
 */
export function challengeSubmissionLimit(challenge: ChallengeOpportunity): number | undefined {
    const raw = challengeMetadataValue(challenge.metadata, 'submissionLimit')
    try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return positiveInteger(parsed)
        }

        const value = parsed as Record<string, unknown>
        const limited = value.limit === true || String(value.limit)
            .toLowerCase() === 'true'
        const unlimited = value.unlimited === true || String(value.unlimited)
            .toLowerCase() === 'true'
        if (limited) return positiveInteger(value.count)
        if (unlimited || 'limit' in value || 'unlimited' in value) return undefined
        return positiveInteger(value.count)
    } catch (error) {
        return positiveInteger(raw)
    }
}

/**
 * Returns an approved HTTP(S) URL from arbitrary Challenge API data.
 *
 * @param value candidate authored destination.
 * @returns normalized HTTP(S) URL, or undefined for unsafe/retired/local URLs.
 * @throws Does not throw.
 */
function safeChallengeLink(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined
    const safeUrl = getSafeCmsLink(value.trim())
    if (!safeUrl || !/^(?:https?:)?\/\//i.test(safeUrl)) return undefined
    try {
        const url = new URL(safeUrl, 'https://topcoder-dev.com')
        return ['http:', 'https:'].includes(url.protocol) ? url.toString() : undefined
    } catch (error) {
        return undefined
    }
}

/**
 * Returns safe, authored right-rail links without synthesizing repository or
 * environment destinations absent from Challenge API metadata.
 *
 * @param challenge raw Challenge API detail response.
 * @returns safe environment, repository, discussion, and attachment links.
 * @throws Does not throw.
 */
export function challengeSidebarLinks(challenge: ChallengeOpportunity): {
    attachments: ChallengeSidebarLink[]
    challengeLinks: ChallengeSidebarLink[]
} {
    const metadataLinks = [
        { label: 'Environment', value: challengeMetadataValue(challenge.metadata, 'environment') },
        { label: 'Code Repository', value: challengeMetadataValue(challenge.metadata, 'codeRepo') },
        {
            label: 'Screening Scorecard',
            value: challengeScorecardUrl(challenge.legacy?.screeningScorecardId),
        },
        {
            label: 'Review Scorecard',
            value: challengeScorecardUrl(challenge.legacy?.reviewScorecardId),
        },
    ]
    const discussions = (challenge.discussions ?? []).map(discussion => ({
        label: discussion.name?.trim() || 'Challenge Discussion',
        value: discussion.url,
    }))
    const challengeLinks = [...metadataLinks, ...discussions]
        .map(link => ({ label: link.label, url: safeChallengeLink(link.value) }))
        .filter((link): link is ChallengeSidebarLink => !!link.url)
    const attachments = (challenge.attachments ?? [])
        .map(attachment => ({
            label: attachment.name?.trim() || attachment.description?.trim() || 'Challenge attachment',
            url: safeChallengeLink(attachment.url),
        }))
        .filter((link): link is ChallengeSidebarLink => !!link.url)
    return { attachments, challengeLinks }
}

/**
 * Builds an environment-aware legacy Online Review scorecard URL.
 *
 * @param scorecardId legacy scorecard identifier exposed by Challenge API.
 * @param onlineReviewUrl configured Online Review base, optionally overridden by tests.
 * @returns safe scorecard URL, or undefined for malformed/nonpositive IDs or configuration.
 * @throws Does not throw.
 */
export function challengeScorecardUrl(
    scorecardId: number | undefined,
    onlineReviewUrl: string = EnvironmentConfig.ADMIN.ONLINE_REVIEW_URL,
): string | undefined {
    if (!Number.isInteger(scorecardId) || Number(scorecardId) <= 0) return undefined
    try {
        const url = new URL(onlineReviewUrl)
        const basePath = url.pathname.replace(/\/+$/, '')
        url.pathname = `${basePath.endsWith('/review') ? basePath : `${basePath}/review`}`
            + '/actions/ViewScorecard'
        url.search = ''
        url.searchParams.set('scid', String(scorecardId))
        return safeChallengeLink(url.toString())
    } catch (error) {
        return undefined
    }
}

/**
 * Derives the public Vanilla web origin from its environment-specific API URL.
 * Production intentionally retains the established discussions.topcoder.com
 * member experience even though its API is hosted at vanilla.topcoder.com.
 *
 * @param v2Url configured Vanilla API v2 URL.
 * @returns member-facing web origin, or undefined for unsafe configuration.
 * @throws Does not throw.
 */
function vanillaWebOrigin(v2Url: string): string | undefined {
    try {
        const url = new URL(v2Url)
        if (!['http:', 'https:'].includes(url.protocol)) return undefined
        return url.hostname === 'vanilla.topcoder.com'
            ? 'https://discussions.topcoder.com'
            : url.origin
    } catch (error) {
        return undefined
    }
}

/**
 * Builds an environment-aware forum URL, preferring an authored safe Challenge
 * discussion and falling back to the legacy forum identifier.
 *
 * @param challenge raw Challenge API detail response.
 * @param v2Url optional Vanilla API URL override used by tests.
 * @returns safe discussion/forum URL, forum home, or undefined for bad config.
 * @throws Does not throw.
 */
export function challengeForumUrl(
    challenge: ChallengeOpportunity,
    v2Url: string = EnvironmentConfig.VANILLA_FORUM.V2_URL,
): string | undefined {
    const discussionUrl = (challenge.discussions ?? [])
        .map(discussion => safeChallengeLink(discussion.url))
        .find(Boolean)
    if (discussionUrl) return discussionUrl

    const origin = vanillaWebOrigin(v2Url)
    if (!origin) return undefined
    const forumId = challenge.legacy?.forumId ?? challenge.forumId
    if (!forumId) return `${origin}/`
    const design = typeof challenge.track === 'string'
        ? challenge.track.toLowerCase() === 'design'
        : challenge.track?.name?.toLowerCase() === 'design'
    const query = design ? `module=ThreadList&forumID=${forumId}` : `module=Category&categoryID=${forumId}`
    return `${origin}/?${query}`
}
