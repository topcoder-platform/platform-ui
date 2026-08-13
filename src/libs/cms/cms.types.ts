/** Supported Payload compatibility spaces used by platform-ui. */
export type CmsSpace = 'default' | 'edu' | 'website'

/** Scalar values accepted by the Payload Contentful-compatible query API. */
export type CmsQueryScalar = string | number | boolean

/** Query parameters accepted by the Payload Contentful-compatible query API. */
export type CmsQuery = Record<string, CmsQueryScalar | ReadonlyArray<CmsQueryScalar> | undefined>

/** Contentful-compatible link metadata retained by Payload CMS. */
export interface CmsLinkSystemProperties {
    id: string
    linkType: 'Asset' | 'Entry' | string
    type: 'Link'
}

/** A retained reference to another Payload-hosted CMS record. */
export interface CmsLink {
    sys: CmsLinkSystemProperties
}

/** System metadata returned by the Payload compatibility API. */
export interface CmsSystemProperties {
    contentType?: CmsLink
    createdAt?: string
    id: string
    publishedAt?: string
    type: 'Asset' | 'Entry'
    updatedAt?: string
}

/** A Payload CMS record in its Contentful-compatible response shape. */
export interface CmsResource<Fields extends Record<string, unknown> = Record<string, unknown>> {
    fields: Fields
    metadata?: Record<string, unknown>
    sys: CmsSystemProperties
}

/** Linked records returned alongside a Payload CMS collection. */
export interface CmsIncludes {
    Asset?: Array<CmsResource>
    Entry?: Array<CmsResource>
}

/** Paginated Payload CMS response in its Contentful-compatible shape. */
export interface CmsCollection<Fields extends Record<string, unknown> = Record<string, unknown>> {
    includes?: CmsIncludes
    items: Array<CmsResource<Fields>>
    limit: number
    skip: number
    sys: {
        type: 'Array'
    }
    total: number
}

/** File metadata attached to a Payload-hosted asset. */
export interface CmsAssetFile {
    contentType?: string
    details?: {
        image?: {
            height: number
            width: number
        }
        size?: number
    }
    fileName?: string
    url: string
}

/** Fields exposed for assets through the Payload compatibility API. */
export interface CmsAssetFields extends Record<string, unknown> {
    description?: string
    file?: CmsAssetFile
    title?: string
}

/** Request error enriched with the failing HTTP status. */
export class CmsRequestError extends Error {
    /** HTTP status returned by Payload CMS. */
    readonly status: number

    /**
     * Creates a CMS request error suitable for page-level error states.
     *
     * @param message safe error message shown by the application.
     * @param status HTTP response status, or zero for a network failure.
     * @throws Does not throw.
     */
    constructor(message: string, status: number) {
        super(message)
        this.name = 'CmsRequestError'
        this.status = status
    }
}
