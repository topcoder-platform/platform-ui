import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrPostAsync } from '~/libs/core'

export interface WebsitePublicationConfig {
    enabled: boolean
    environment: 'dev' | 'production'
}

export interface WebsitePublication {
    environment: 'dev' | 'production'
    pipelineId: string
    status: string
    url: string
}

export const publicationEndpoint = EnvironmentConfig.ENV === 'prod'
    ? 'https://cms.topcoder.com/api/website-publication'
    : 'https://cms.topcoder-dev.com/api/website-publication'

/** Reads publishing availability for the current app environment using the signed-in user's JWT. */
export function getPublicationConfig(): Promise<WebsitePublicationConfig> {
    return xhrGetAsync<WebsitePublicationConfig>(publicationEndpoint)
}

/** Queues the server-selected environment's content pipeline; rejects on authorization or service errors. */
export function publishWebsite(): Promise<WebsitePublication> {
    return xhrPostAsync<Record<string, never>, WebsitePublication>(publicationEndpoint, {})
}

/** Reads the given pipeline's verified workflow status; the server checks project and environment ownership. */
export function getPublication(pipelineId: string): Promise<WebsitePublication> {
    return xhrGetAsync<WebsitePublication>(`${publicationEndpoint}?pipelineId=${encodeURIComponent(pipelineId)}`)
}

/** Returns whether CircleCI has reported a terminal workflow state for the supplied publication. */
export function publicationFinished(status?: string): boolean {
    return !!status && ['success', 'failed', 'error', 'canceled', 'unauthorized', 'not_run'].includes(status)
}
