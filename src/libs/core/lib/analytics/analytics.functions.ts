import {
    Attr,
    ClickstreamAnalytics,
    PageType,
    SendMode,
} from '@aws/clickstream-web'
import { EnvironmentConfig } from '~/config'

export type AnalyticsAttributes = Record<string, boolean | number | string>

const ANALYTICS_ID_COOKIE = 'tc_analytics_id'
const ANALYTICS_ID_LIFETIME_SECONDS = 365 * 24 * 60 * 60
const MAX_ATTRIBUTE_LENGTH = 100
const UTM_COOKIE = 'tc_utm'
const UTM_KEYS = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_id',
    'utm_term',
    'utm_content',
] as const

type UtmKey = typeof UTM_KEYS[number]
type UtmValues = Partial<Record<UtmKey, string>>

let initialized = false

/**
 * Initializes the first-party AWS Clickstream client once for Platform UI.
 *
 * @returns true when analytics is configured and available; false when configuration is absent,
 * privacy signals disable collection, the browser APIs are unavailable, or initialization fails.
 * @throws Does not throw; analytics must never interrupt application behavior.
 */
export function initializeAnalytics(): boolean {
    if (initialized) return true
    if (typeof window === 'undefined' || typeof document === 'undefined') return false
    if (!EnvironmentConfig.ANALYTICS.APP_ID || !EnvironmentConfig.ANALYTICS.ENDPOINT) return false
    if (analyticsIsOptedOut()) return false

    try {
        const analyticsId = getOrCreateAnalyticsId()
        initialized = ClickstreamAnalytics.init({
            appId: EnvironmentConfig.ANALYTICS.APP_ID,
            endpoint: EnvironmentConfig.ANALYTICS.ENDPOINT,
            globalAttributes: {
                ...trafficSourceAttributes(),
                environment: EnvironmentConfig.ENV,
                surface: 'platform_ui',
            },
            isLogEvents: false,
            isTrackAppEndEvents: false,
            isTrackAppStartEvents: false,
            isTrackClickEvents: false,
            isTrackPageLoadEvents: false,
            isTrackPageViewEvents: true,
            isTrackScrollEvents: false,
            isTrackSearchEvents: false,
            isTrackUserEngagementEvents: true,
            pageType: PageType.SPA,
            sendEventsInterval: 5000,
            sendMode: SendMode.Batch,
        })
        if (initialized) ClickstreamAnalytics.setUserId(analyticsId)
        return initialized
    } catch {
        initialized = false
        return false
    }
}

/**
 * Records an application event after AWS Clickstream has initialized.
 *
 * @param name stable event name shared by all Topcoder web surfaces.
 * @param attributes non-sensitive event dimensions; callers must not include names, email, free text, or URL queries.
 * @param isImmediate whether the SDK should bypass its normal batch interval for navigation-critical events.
 * @returns void after recording or a no-op when analytics is unavailable.
 * @throws Does not throw; SDK failures are isolated from the product flow.
 */
export function recordAnalyticsEvent(
    name: string,
    attributes: AnalyticsAttributes = {},
    isImmediate: boolean = false,
): void {
    if (!initialized) return
    try {
        ClickstreamAnalytics.record({ attributes, isImmediate, name })
    } catch {
        // Product behavior must remain independent from optional analytics delivery.
    }
}

/**
 * Adds or clears the authenticated Topcoder member ID while preserving the browser-scoped funnel identifier.
 *
 * @param memberId numeric or string member ID, or undefined after logout.
 * @returns void after updating the SDK global attributes, or a no-op before initialization.
 * @throws Does not throw; profile transitions must not be affected by analytics.
 */
export function setAnalyticsMemberId(memberId: number | string | undefined): void {
    if (!initialized) return
    try {
        ClickstreamAnalytics.setGlobalAttributes({
            // AWS Clickstream removes a global attribute when its value is null.
            // eslint-disable-next-line unicorn/no-null
            member_id: memberId === undefined ? null : String(memberId),
        })
    } catch {
        // Profile behavior must remain independent from optional analytics delivery.
    }
}

/**
 * Converts a browser click into a privacy-safe location event.
 *
 * Only interactive elements are tracked. The event contains coarse viewport coordinates, semantic placement,
 * element type/ID, and an HTTP destination without query parameters; rendered text is deliberately excluded.
 *
 * @param event document-level browser click event.
 * @returns void after recording a safe click event, or when no interactive target exists.
 * @throws Does not throw; malformed destinations are ignored.
 */
export function recordAnalyticsClick(event: MouseEvent): void {
    const target = event.target instanceof Element ? event.target : undefined
    const interactiveElement = target?.closest('a, button, [role="button"], [data-analytics-id]')
    if (!interactiveElement) return

    const attributes: AnalyticsAttributes = {
        click_x_percent: viewportPercentage(event.clientX, window.innerWidth),
        click_y_percent: viewportPercentage(event.clientY, window.innerHeight),
        element_type: safeAttribute(interactiveElement.tagName.toLowerCase()),
        page_path: safeAttribute(window.location.pathname),
    }
    const elementId = interactiveElement.getAttribute('data-analytics-id') || interactiveElement.id
    if (elementId) attributes.element_id = safeIdentifier(elementId)

    const explicitPlacement = interactiveElement.closest('[data-analytics-placement]')
        ?.getAttribute('data-analytics-placement')
    const landmark = interactiveElement.closest('header, nav, main, aside, footer')
        ?.tagName.toLowerCase()
    if (explicitPlacement || landmark) {
        attributes.placement = safeIdentifier(explicitPlacement || landmark || '')
    }

    const anchor = interactiveElement.closest('a')
    if (anchor instanceof HTMLAnchorElement) addSafeDestination(attributes, anchor.href)
    recordAnalyticsEvent('ui_click', attributes, anchor instanceof HTMLAnchorElement)
}

/**
 * Determines whether browser privacy preferences disable analytics collection.
 *
 * @returns true when Global Privacy Control or Do Not Track is enabled.
 * @throws Does not throw.
 */
function analyticsIsOptedOut(): boolean {
    const privacyNavigator = navigator as Navigator & { globalPrivacyControl?: boolean }
    return privacyNavigator.globalPrivacyControl === true || navigator.doNotTrack === '1'
}

/**
 * Reads or creates the pseudonymous ID shared by Topcoder subdomains.
 *
 * @returns an existing validated identifier or a newly generated UUID.
 * @throws Does not throw under supported browser APIs.
 */
function getOrCreateAnalyticsId(): string {
    const existing = readCookie(ANALYTICS_ID_COOKIE)
    if (existing && /^[A-Za-z0-9-]{16,64}$/.test(existing)) return existing
    const analyticsId = createUuid()
    writeCookie(ANALYTICS_ID_COOKIE, analyticsId, ANALYTICS_ID_LIFETIME_SECONDS)
    return analyticsId
}

/**
 * Creates a random RFC 4122 version-4 identifier without collecting device data.
 *
 * @returns browser-generated UUID.
 * @throws Does not throw when the Web Crypto API is available.
 */
function createUuid(): string {
    if (typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID()
    const bytes = window.crypto.getRandomValues(new Uint8Array(16))
    /* eslint-disable no-bitwise */
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    /* eslint-enable no-bitwise */
    const hex = Array.from(bytes, value => value.toString(16)
        .padStart(2, '0'))
        .join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${
        hex.slice(16, 20)}-${hex.slice(20)}`
}

/**
 * Reads one decoded cookie value.
 *
 * @param name exact cookie name.
 * @returns decoded value or undefined when absent or malformed.
 * @throws Does not throw.
 */
function readCookie(name: string): string | undefined {
    const prefix = `${name}=`
    const cookie = document.cookie.split(';')
        .map(value => value.trim())
        .find(value => value.startsWith(prefix))
    if (!cookie) return undefined
    try {
        return decodeURIComponent(cookie.slice(prefix.length))
    } catch {
        return undefined
    }
}

/**
 * Writes a first-party cookie with a shared Topcoder domain where possible.
 *
 * @param name cookie name.
 * @param value cookie value.
 * @param maxAge lifetime in seconds.
 * @returns void after assigning document.cookie.
 * @throws Does not throw.
 */
function writeCookie(name: string, value: string, maxAge: number): void {
    const domain = analyticsCookieDomain()
    const secure = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${
        domain ? `; Domain=${domain}` : ''}${secure}`
}

/**
 * Selects the registrable Topcoder domain used to connect cross-subdomain journeys.
 *
 * @returns production/development cookie domain, or undefined for localhost and unrelated hosts.
 * @throws Does not throw.
 */
function analyticsCookieDomain(): string | undefined {
    if (window.location.hostname === 'topcoder.com' || window.location.hostname.endsWith('.topcoder.com')) {
        return '.topcoder.com'
    }

    if (window.location.hostname === 'topcoder-dev.com'
        || window.location.hostname.endsWith('.topcoder-dev.com')) {
        return '.topcoder-dev.com'
    }

    if (window.location.hostname === 'topcoder-qa.com'
        || window.location.hostname.endsWith('.topcoder-qa.com')) {
        return '.topcoder-qa.com'
    }

    return undefined
}

/**
 * Builds AWS-standard traffic-source attributes from the current URL, falling back to first-touch UTM cookies.
 *
 * @returns global Clickstream attributes containing only present, sanitized UTM values.
 * @throws Does not throw; malformed cookie JSON is ignored.
 */
function trafficSourceAttributes(): AnalyticsAttributes {
    const current = new URLSearchParams(window.location.search)
    const stored = storedUtmValues()
    const values = Object.fromEntries(UTM_KEYS.map(key => [
        key,
        sanitizeUtmValue(current.get(key) || stored[key] || ''),
    ])) as Record<UtmKey, string>
    return Object.fromEntries([
        [Attr.TRAFFIC_SOURCE_SOURCE, values.utm_source],
        [Attr.TRAFFIC_SOURCE_MEDIUM, values.utm_medium],
        [Attr.TRAFFIC_SOURCE_CAMPAIGN, values.utm_campaign],
        [Attr.TRAFFIC_SOURCE_CAMPAIGN_ID, values.utm_id],
        [Attr.TRAFFIC_SOURCE_TERM, values.utm_term],
        [Attr.TRAFFIC_SOURCE_CONTENT, values.utm_content],
    ].filter((entry): entry is [string, string] => !!entry[1]))
}

/**
 * Parses the shared first-touch UTM cookie into an allow-listed shape.
 *
 * @returns sanitized UTM values or an empty object when unavailable.
 * @throws Does not throw.
 */
function storedUtmValues(): UtmValues {
    const value = readCookie(UTM_COOKIE)
    if (!value) return {}
    try {
        const parsed = JSON.parse(value) as unknown
        if (!isRecord(parsed)) return {}
        return Object.fromEntries(UTM_KEYS.flatMap(key => (
            typeof parsed[key] === 'string'
                ? [[key, sanitizeUtmValue(parsed[key] as string)]]
                : []
        )))
    } catch {
        return {}
    }
}

/**
 * Narrows decoded JSON to an indexable non-array object.
 *
 * @param value decoded JSON value.
 * @returns true when value is a plain record candidate.
 * @throws Does not throw.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Restricts UTM values to a bounded marketing-token character set.
 *
 * @param value raw URL or cookie value.
 * @returns sanitized value of at most 100 characters.
 * @throws Does not throw.
 */
function sanitizeUtmValue(value: string): string {
    return value.replace(/[^A-Za-z0-9._~-]/g, '')
        .slice(0, MAX_ATTRIBUTE_LENGTH)
}

/**
 * Restricts a semantic identifier to low-cardinality, analytics-safe characters.
 *
 * @param value DOM-authored identifier.
 * @returns sanitized identifier.
 * @throws Does not throw.
 */
function safeIdentifier(value: string): string {
    return value.replace(/[^A-Za-z0-9_:-]/g, '_')
        .slice(0, MAX_ATTRIBUTE_LENGTH)
}

/**
 * Bounds an event attribute to the recommended AWS Clickstream length.
 *
 * @param value safe application-derived attribute.
 * @returns at most 100 characters.
 * @throws Does not throw.
 */
function safeAttribute(value: string): string {
    return value.slice(0, MAX_ATTRIBUTE_LENGTH)
}

/**
 * Calculates a coarse click position without retaining screen dimensions.
 *
 * @param coordinate click coordinate in CSS pixels.
 * @param dimension viewport dimension in CSS pixels.
 * @returns integer percentage clamped between zero and 100.
 * @throws Does not throw.
 */
function viewportPercentage(coordinate: number, dimension: number): number {
    if (dimension <= 0) return 0
    return Math.max(0, Math.min(100, Math.round((coordinate / dimension) * 100)))
}

/**
 * Adds a query-free HTTP destination to a click event.
 *
 * @param attributes mutable event attribute collection.
 * @param href browser-resolved anchor destination.
 * @returns void after adding destination host/path, or when the URL is unsupported.
 * @throws Does not throw; invalid URLs are ignored.
 */
function addSafeDestination(attributes: AnalyticsAttributes, href: string): void {
    try {
        const destination = new URL(href, window.location.origin)
        if (!['http:', 'https:'].includes(destination.protocol)) return
        attributes.destination_host = safeAttribute(destination.hostname)
        attributes.destination_path = safeAttribute(destination.pathname)
    } catch {
        // Non-URL actions are intentionally excluded.
    }
}
