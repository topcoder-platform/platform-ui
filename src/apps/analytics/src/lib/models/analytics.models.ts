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

/** Exact page-path filters supported by the detailed route endpoint. */
export interface RouteFilters extends GeneralFilters {
    path: string
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

/** Detailed engagement totals for one exact route. */
export interface RouteTotals extends GeneralTotals {
    clickThroughPercent: number
    newVisitors: number
    returningVisitors: number
    unknownVisitorType: number
    averageEngagementSeconds: number
    entrances: number
    bounces: number
    bounceRatePercent: number
    conversions: number
    conversionRatePercent: number
    formStarts: number
    formCompletions: number
    formAbandonments: number
}

/** Mutually exclusive acquisition group assigned from a visitor's first route view. */
export interface RouteVisitorSource {
    source: 'organic' | 'paid' | 'social' | 'email' | 'other'
    visitors: number
    percent: number
}

/** Privacy-safe click aggregate for one semantic item on the selected route. */
export interface RouteClickLocation extends Omit<ClickLocation, 'pagePath'> {
    clickThroughPercent: number
}

/** Aggregate lifecycle metrics for one instrumented form on the selected route. */
export interface RouteFormBreakdown {
    formId: string
    views: number
    viewers: number
    starts: number
    starters: number
    completions: number
    completers: number
    abandonments: number
    abandoners: number
    completionRatePercent: number
    abandonmentRatePercent: number
}

/** Last-interacted field aggregate emitted when an instrumented form is abandoned. */
export interface RouteFormAbandonment {
    formId: string
    fieldId: string
    abandonments: number
    visitors: number
}

/** Ordered page-to-challenge funnel for the selected route and reporting period. */
export interface RouteChallengeFunnel {
    pageVisitors: number
    challengeCtaClickers: number
    registrations: number
    submissions: number
    wins: number | null
    clickThroughPercent: number
    clickToRegistrationPercent: number
    registrationToSubmissionPercent: number
    winTrackingAvailable: boolean
}

/** Complete detailed route report returned by analytics-api. */
export interface RouteReport {
    generatedAt: string
    dataThrough?: string
    filters: Required<RouteFilters>
    totals: RouteTotals
    visitorSources: RouteVisitorSource[]
    clickLocations: RouteClickLocation[]
    forms: RouteFormBreakdown[]
    formAbandonments: RouteFormAbandonment[]
    funnel: RouteChallengeFunnel
}

/** Safe request-error category rendered by the analytics UI. */
export interface AnalyticsRequestError {
    kind: 'authorization' | 'configuration' | 'general' | 'timeout' | 'throttled'
    message: string
    status?: number
}
