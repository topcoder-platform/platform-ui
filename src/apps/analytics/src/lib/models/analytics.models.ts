/** Query parameters shared by both analytics report tabs. */
export interface AnalyticsDateRange {
    from: string
    to: string
}

/** Campaign funnel filters supported by the read-only API. */
export interface CampaignFilters extends AnalyticsDateRange {
    campaign?: string
    campaignId?: string
    medium?: string
    source?: string
}

/** General site analytics filters supported by the read-only API. */
export interface GeneralFilters extends AnalyticsDateRange {
    surface?: string
}

/** Server-provided bounded filter options and data freshness. */
export interface AnalyticsFilterOptions {
    campaigns: string[]
    campaignIds: string[]
    sources: string[]
    mediums: string[]
    surfaces: string[]
    generatedAt: string
    minDate?: string
    maxDate?: string
    dataThrough?: string
}

/** Ordered funnel totals for the selected campaign cohort. */
export interface CampaignTotals {
    landingUsers: number
    landingClickers: number
    registrations: number
    submissions: number
    clickThroughPercent: number
    clickToRegistrationPercent: number
    registrationToSubmissionPercent: number
    landingToSubmissionPercent: number
}

/** One daily point in the ordered campaign funnel. */
export interface CampaignSeriesPoint {
    date: string
    landingUsers: number
    landingClickers: number
    registrations: number
    submissions: number
}

/** One first-touch campaign breakdown row. */
export interface CampaignBreakdown {
    campaign: string
    campaignId?: string
    source: string
    medium: string
    landingUsers: number
    landingClickers: number
    registrations: number
    submissions: number
}

/** One landing-page funnel breakdown row. */
export interface LandingPageBreakdown {
    path: string
    landingUsers: number
    landingClickers: number
    registrations: number
    submissions: number
}

/** Privacy-safe aggregate click-location row. */
export interface ClickLocation {
    pagePath: string
    placement?: string
    elementId?: string
    elementType?: string
    destinationHost?: string
    destinationPath?: string
    xBucket?: number
    yBucket?: number
    clicks: number
    clickers: number
}

/** Complete ordered campaign report returned by analytics-api. */
export interface CampaignReport {
    generatedAt: string
    dataThrough?: string
    filters: Required<CampaignFilters>
    totals: CampaignTotals
    series: CampaignSeriesPoint[]
    campaigns: CampaignBreakdown[]
    landingPages: LandingPageBreakdown[]
    clickLocations: ClickLocation[]
}

/** General engagement totals across Topcoder web surfaces. */
export interface GeneralTotals {
    pageViews: number
    visitors: number
    clicks: number
    clickers: number
}

/** One daily general engagement point. */
export interface GeneralSeriesPoint {
    date: string
    pageViews: number
    visitors: number
    clicks: number
    clickers: number
}

/** Page-level general analytics breakdown. */
export interface PageBreakdown {
    surface: string
    path: string
    pageViews: number
    visitors: number
}

/** Traffic-source general analytics breakdown. */
export interface SourceBreakdown {
    source: string
    pageViews: number
    visitors: number
}

/** Application-surface general analytics breakdown. */
export interface SurfaceBreakdown {
    surface: string
    pageViews: number
    visitors: number
    clicks: number
}

/** Complete general site report returned by analytics-api. */
export interface GeneralReport {
    generatedAt: string
    dataThrough?: string
    filters: Required<GeneralFilters>
    totals: GeneralTotals
    series: GeneralSeriesPoint[]
    pages: PageBreakdown[]
    sources: SourceBreakdown[]
    surfaces: SurfaceBreakdown[]
}

/** Safe request-error category rendered by the analytics UI. */
export interface AnalyticsRequestError {
    kind: 'authorization' | 'configuration' | 'general' | 'timeout' | 'throttled'
    message: string
    status?: number
}
