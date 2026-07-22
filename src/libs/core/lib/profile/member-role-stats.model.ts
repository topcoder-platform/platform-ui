/**
 * Special member roles supported by the role-based profile statistics APIs.
 */
export type MemberSpecialRole = 'copilot' | 'reviewer'

/**
 * Challenge tracks included in a copilot role summary.
 */
export type MemberRoleTrack = 'DEVELOPMENT' | 'DESIGN' | 'QUALITY_ASSURANCE' | 'DATA_SCIENCE'

/**
 * Completion totals used to calculate a copilot's challenge fulfillment rate.
 */
export interface MemberRoleFulfillment {
    cancelled: number
    completed: number
    rate: number
    total: number
}

/**
 * Copilot-specific totals returned with role statistics.
 */
export interface MemberCopilotStats {
    challengeCount: number
}

/**
 * Reviewer-specific totals returned with role statistics.
 */
export interface MemberReviewerStats {
    challengeCount: number
}

/**
 * Role summary shown above the member stats card.
 *
 * Roles are omitted when the member has no challenges for that role.
 */
export interface MemberRoleStats {
    copilot?: MemberCopilotStats
    reviewer?: MemberReviewerStats
}

/**
 * A challenge on which a member served as a copilot or reviewer.
 */
export interface MemberRoleChallenge {
    id: string
    name: string
}

/**
 * Newest-first challenges and aggregate statistics for a member special role.
 */
export interface MemberRoleChallenges {
    challenges: MemberRoleChallenge[]
    fulfillment?: MemberRoleFulfillment
    role: MemberSpecialRole
    total: number
    trackCounts?: Partial<Record<MemberRoleTrack, number>>
}
