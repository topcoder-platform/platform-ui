import type { ChallengeOpportunity } from '../models'

/**
 * Challenge tags hidden from the member home feed. Community-app's dashboard
 * excluded its `INNOVATION_CHALLENGES_TAG` config value client-side because
 * Challenge API has no "exclude tag" filter.
 */
export const HOME_EXCLUDED_CHALLENGE_TAGS: ReadonlyArray<string> = ['Innovation Challenge']

/** Number of challenges the member home feed shows (community-app `itemCount`). */
export const HOME_CHALLENGE_FEED_SIZE: number = 5

/**
 * Challenge API type abbreviations shown by the home feed: Challenge,
 * First2Finish, and Marathon Match. Tasks are deliberately excluded.
 */
export const HOME_CHALLENGE_TYPES: ReadonlyArray<string> = ['CH', 'F2F', 'MM']

/** Time zone community-app used for the "Topcoder Time" clock. */
export const HOME_TIMEZONE: string = 'America/New_York'

/** Default auto-advance interval, in seconds, for CMS content sliders. */
export const HOME_SLIDER_DEFAULT_DURATION_SECONDS: number = 5

/** CMS layout slots retained from the community-app dashboard. */
export type HomeViewportSlot = 'centerTop' | 'leftBottom' | 'rightBottom'

/**
 * Retained Payload (formerly Contentful) `default`-space viewport entry IDs.
 * Community-app chose the `[DEV ENV]` entries when its base URL contained
 * `-dev`, and the production entries otherwise.
 */
const HOME_VIEWPORT_IDS: Record<'dev' | 'prod', Record<HomeViewportSlot, string>> = {
    dev: {
        centerTop: 'IYMEHgYwk6S0S9tx5SsHd',
        leftBottom: '2tq6jtu9GzPab7lAb7swlT',
        rightBottom: '2qVJTorSdRVNlfRqoQocUH',
    },
    prod: {
        centerTop: '1BK50OyMT29IOavUC7wSEB',
        leftBottom: '6sjlJHboX3aG3mFS5FnZND',
        rightBottom: 'SSwOFPT8l0WpGhqCBRISG',
    },
}

/** Markdown/HTML authored in one CMS content block. */
export interface HomeCmsMarkdownBlock {
    id: string
    kind: 'markdown'
    text: string
}

/** An auto-advancing CMS content slider and its rendered slides. */
export interface HomeCmsSliderBlock {
    autoplay: boolean
    id: string
    intervalMs: number
    kind: 'slider'
    slides: HomeCmsMarkdownBlock[]
}

/** A renderable block extracted from a CMS viewport tree. */
export type HomeCmsBlock = HomeCmsMarkdownBlock | HomeCmsSliderBlock

interface HomeCmsEntry {
    fields: Record<string, unknown>
    id: string
    type: string
}

/**
 * Selects the dashboard viewport entries for the deployment environment.
 *
 * @param tcDomain Topcoder domain for the current deployment, for example `topcoder-dev.com`.
 * @returns the center, left, and right viewport IDs. Any `-dev` domain uses the
 * `[DEV ENV]` entries; every other domain uses the production entries, matching community-app.
 * @throws Does not throw.
 */
export function getHomeViewportIds(tcDomain: string): Record<HomeViewportSlot, string> {
    return tcDomain.includes('-dev') ? HOME_VIEWPORT_IDS.dev : HOME_VIEWPORT_IDS.prod
}

/**
 * Removes the home feed's excluded challenges and limits the result to the feed size.
 *
 * @param challenges Challenge API list items in API order.
 * @param excludedTags tags whose challenges must not be shown (exact, case-sensitive match).
 * @param limit maximum number of challenges to return.
 * @returns at most `limit` challenges without any excluded tag, in their original order.
 * @throws Does not throw; challenges without tags are kept.
 */
export function filterHomeChallenges(
    challenges: ReadonlyArray<ChallengeOpportunity>,
    excludedTags: ReadonlyArray<string> = HOME_EXCLUDED_CHALLENGE_TAGS,
    limit: number = HOME_CHALLENGE_FEED_SIZE,
): ChallengeOpportunity[] {
    return challenges
        .filter(challenge => !(challenge.tags ?? []).some(tag => excludedTags.includes(tag)))
        .slice(0, Math.max(0, limit))
}

const MONTH_NAMES: ReadonlyArray<string> = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const EASTERN_TIME_FORMAT: Intl.DateTimeFormat = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: 'numeric',
    second: '2-digit',
    timeZone: HOME_TIMEZONE,
    year: 'numeric',
})

/**
 * Adds an English ordinal suffix to a day of the month.
 *
 * @param day day of the month.
 * @returns `1st`, `2nd`, `3rd`, `11th`, `22nd`, and so on.
 * @throws Does not throw.
 */
function ordinalDay(day: number): string {
    const lastTwoDigits = day % 100
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
        return `${day}th`
    }

    return `${day}${['th', 'st', 'nd', 'rd'][day % 10] ?? 'th'}`
}

/**
 * Formats the community-app "Topcoder Time" clock value.
 *
 * Uses the browser's `Intl` time-zone data rather than a time-zone library so
 * the shared Opportunities chunks stay small.
 *
 * @param date instant to format.
 * @returns the US Eastern wall-clock time with its current UTC offset,
 * for example `Oct 8th, 07:31 UTC-4` (or `UTC-5` outside daylight saving time).
 * @throws RangeError when `date` is invalid.
 */
export function formatTopcoderTime(date: Date): string {
    const parts: Record<string, number> = {}
    EASTERN_TIME_FORMAT.formatToParts(date)
        .forEach(part => {
            if (part.type !== 'literal') {
                parts[part.type] = Number(part.value)
            }
        })
    // Some engines report midnight as hour 24 even with the h23 cycle.
    const hour = parts.hour % 24
    const wallClockAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, hour, parts.minute, parts.second)
    const offsetMinutes = Math.round((wallClockAsUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000)
    const offsetHours = offsetMinutes / 60
    const offset = `UTC${offsetHours >= 0 ? '+' : ''}${offsetHours}`
    const time = `${String(hour)
        .padStart(2, '0')}:${String(parts.minute)
        .padStart(2, '0')}`
    return `${MONTH_NAMES[parts.month - 1]} ${ordinalDay(parts.day)}, ${time} ${offset}`
}

/**
 * Removes `<style>` elements from CMS-authored text. Legacy dashboard blocks
 * shipped page CSS inside their Markdown; the shared CMS sanitizer would
 * otherwise unwrap the disallowed element and show the CSS as visible text.
 *
 * @param text CMS Markdown/HTML.
 * @returns text without style elements.
 * @throws Does not throw.
 */
export function stripCmsStyleElements(text: string): string {
    return text
        .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '')
        .replace(/<style\b[^>]*\/?>/gi, '')
}

/**
 * Reads an embedded CMS entry. Unresolved links and assets are ignored.
 *
 * @param value field value from a resolved CMS collection.
 * @returns the entry ID, content type, and fields, or undefined when not a renderable entry.
 * @throws Does not throw.
 */
function readCmsEntry(value: unknown): HomeCmsEntry | undefined {
    const record = value as {
        fields?: unknown
        sys?: {
            contentType?: { sys?: { id?: unknown } }
            id?: unknown
            type?: unknown
        }
    } | undefined
    const id = record?.sys?.id
    const type = record?.sys?.contentType?.sys?.id
    if (
        record?.sys?.type !== 'Entry'
        || typeof id !== 'string'
        || typeof type !== 'string'
        || !record.fields
        || typeof record.fields !== 'object'
    ) {
        return undefined
    }

    return { fields: record.fields as Record<string, unknown>, id, type }
}

/**
 * Converts a CMS content block to a Markdown block, dropping blocks community-app hid.
 *
 * @param entry embedded `contentBlock` entry.
 * @returns a Markdown block, or undefined for hidden, style-only, or empty blocks.
 * @throws Does not throw.
 */
function toMarkdownBlock(entry: HomeCmsEntry): HomeCmsMarkdownBlock | undefined {
    const containerStyles = entry.fields.extraStylesForContainer as Record<string, unknown> | undefined
    if (String(containerStyles?.display ?? '')
        .trim()
        .toLowerCase() === 'none') {
        return undefined
    }

    const text = stripCmsStyleElements(typeof entry.fields.text === 'string' ? entry.fields.text : '')
        .trim()
    return text ? { id: entry.id, kind: 'markdown', text } : undefined
}

/**
 * Recursively collects renderable blocks from one CMS entry.
 *
 * @param value embedded CMS entry or link.
 * @param ancestors entry IDs already visited on this branch, used to stop cycles.
 * @returns blocks in authored order.
 * @throws Does not throw.
 */
function collectBlocks(value: unknown, ancestors: ReadonlySet<string>): HomeCmsBlock[] {
    const entry = readCmsEntry(value)
    if (!entry || ancestors.has(entry.id)) {
        return []
    }

    const nextAncestors = new Set(ancestors)
    nextAncestors.add(entry.id)
    const children = (field: unknown): HomeCmsBlock[] => (Array.isArray(field) ? field : [])
        .flatMap(child => collectBlocks(child, nextAncestors))

    if (entry.type === 'viewport') {
        return children(entry.fields.content)
    }

    if (entry.type === 'contentBlock') {
        const block = toMarkdownBlock(entry)
        return block ? [block] : []
    }

    if (entry.type === 'contentSlider') {
        const slides = children(entry.fields.items)
            .flatMap(block => (block.kind === 'markdown' ? [block] : block.slides))
        const duration = Number(entry.fields.duration)
        return slides.length ? [{
            autoplay: entry.fields.autoStart !== false,
            id: entry.id,
            intervalMs: (Number.isFinite(duration) && duration > 0
                ? duration
                : HOME_SLIDER_DEFAULT_DURATION_SECONDS) * 1000,
            kind: 'slider',
            slides,
        }] : []
    }

    return []
}

/**
 * Flattens a resolved CMS viewport into the blocks the member home page renders.
 *
 * Supports the content types used by the community-app dashboard viewports:
 * nested `viewport`s, `contentBlock` Markdown, and `contentSlider` carousels.
 * Other content types are skipped, as are blocks hidden with
 * `extraStylesForContainer.display: none` (legacy CSS carriers) and blocks
 * whose text is empty once `<style>` elements are removed.
 *
 * @param viewport the viewport entry returned by PayloadCmsClient with links resolved.
 * @returns renderable blocks in authored order; empty when the viewport is absent.
 * @throws Does not throw; malformed or cyclic content is skipped.
 */
export function collectHomeCmsBlocks(viewport: unknown): HomeCmsBlock[] {
    return collectBlocks(viewport, new Set())
}
