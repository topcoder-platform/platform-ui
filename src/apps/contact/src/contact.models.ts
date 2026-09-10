/** Transport models shared with contact-api-v6/docs/api-contract.md. */
export interface SegmentFilter {
    countries?: string[]
    joinedFrom?: string
    joinedTo?: string
    skillIds?: string[]
    availableForGigs?: boolean
    groupIds?: string[]
    rating?: { min?: number; max?: number; trackId?: string; typeId?: string }
    languages?: string[]
    activeFrom?: string
    activeTo?: string
}

export interface SubscriptionType {
    id: string
    name: string
    description: string
    active: boolean
}

export interface Segment {
    id: string
    name: string
    filter: SegmentFilter
    createdAt: string
    createdBy: string
    createdByHandle: string
    memberCount: number
}

/** Canonical members matching saved criteria before email consent and delivery eligibility checks. */
export interface SegmentMemberPage {
    members: Array<{ memberId: string; handle: string; email: string }>
    total: number
    limit: number
    offset: number
}

export interface ContactConfig {
    subscriptionTypes: SubscriptionType[]
    sender: string
    testEmail: string
    pricing: { currency: string; perThousandEmails: number; perGbData: number; sourceUrl: string }
    clippingLimitBytes: number
    mergeFields: string[]
    sendingEnabled: boolean
    warnings?: string[]
}

export interface CampaignInput {
    name: string
    subject: string
    html: string
    text?: string
    editorDesign?: Record<string, unknown>
    subscriptionTypeId: string
    segment: SegmentFilter
    trackingEnabled: boolean
    excludeUnengagedDays?: number
    campaign?: string
    campaignId?: string
    source?: string
    pageTitle?: string
}

export interface Campaign extends CampaignInput {
    id: string
    revision: number
    status: string
    createdAt: string
    updatedAt: string
    scheduledAt?: string
    recipientCount?: number
}

export interface AudiencePreview {
    audienceToken: string
    status: 'pending' | 'ready' | 'failed'
    recipientCount: number
    excludedCount: number
    expiresAt: string
    estimatedCostUsd: number
    emailBytes: number
    maxEmailBytes: number
    clippingLimitBytes: number
    warnings: string[]
    sample: Array<{ memberId: string; handle: string; email: string }>
}

export interface EmailPreview {
    html: string
    text: string
    subject: string
    emailBytes: number
    clippingLimitBytes: number
}

export interface CampaignReport {
    recipientCount: number
    sent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    complained: number
    unsubscribed: number
    skipped: number
    failed: number
    uncertain: number
    openRate: number
    clickRate: number
    clickThroughRate: number
    links: Array<{ url: string; clicks: number }>
    devices: Array<{ device: string; count: number }>
    warnings: string[]
}

export interface RecipientPage {
    items: Array<{
        id: string
        memberId: string
        email: string
        handle: string
        status: string
        sentAt?: string
        openedAt?: string
        clickedAt?: string
        reason?: string
    }>
    total: number
}

/** Exact active member resolved from a handle or email; the ID is used only for subsequent API requests. */
export interface MemberIdentity {
    memberId: string
    handle: string
    email: string
}

export interface MemberSubscriptions {
    memberId: string
    subscriptions: Array<{ subscriptionTypeId: string; subscribed: boolean; source: string }>
    suppressed: boolean
}

/** Member-joined sequence; activated templates and filters are immutable. */
export interface Automation {
    id: string
    name: string
    segment: SegmentFilter
    subscriptionTypeId: string
    steps: Array<{ id: string; campaignTemplateId: string; delayHours: number }>
    revision: number
    active: boolean
    activatedAt?: string
    maxEmailsPerDay: number
    createdAt: string
    lastError?: string
    enrolledCount: number
    scheduledCount: number
}

/** Reusable newsletter layout persisted independently of recipient and campaign settings. */
export interface EmailTemplate {
    id: string
    name: string
    html: string
    editorDesign?: Record<string, unknown>
}
