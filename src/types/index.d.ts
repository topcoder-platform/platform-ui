import type { AnalyticsSnippet } from '@segment/analytics-next'

export { }

declare global {
    interface Window {
        tcSegment: AnalyticsSnippet;
    }
}
