import qs from 'qs'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrPostAsync } from '~/libs/core'

export type PaymentDetail = {
    id: string
    netAmount: string
    grossAmount: string
    totalAmount: string
    installmentNumber: number
    status: string
    currency: string
    datePaid: string | null
}

export type PaymentWinning = {
    id: string
    type: 'PAYMENT' | 'REWARD'
    handle?: string
    winnerId: string
    origin?: string
    category?: string
    title?: string
    description?: string
    externalId: string
    attributes?: Record<string, unknown>
    details: PaymentDetail[]
    createdAt?: string
    releaseDate?: string
    datePaid?: string | null
}

export type ChallengePaymentsResponse = {
    winnings: PaymentWinning[]
    pagination: { totalItems: number; totalPages: number; pageSize: number; currentPage: number }
}

export async function getChallengePayments(
    challengeId: string,
): Promise<ChallengePaymentsResponse> {
    return xhrGetAsync<ChallengePaymentsResponse>(
        `${EnvironmentConfig.API.V6}/finance/challenge-payments/${challengeId}`,
    )
}

export async function createWinning(payload: any): Promise<unknown> {
    return xhrPostAsync(`${EnvironmentConfig.API.V6}/finance/winnings`, payload)
}

export async function autocompleteMembers(term: string): Promise<Array<{ handle: string }>> {
    return xhrGetAsync<Array<{ handle: string }>>(
        `${EnvironmentConfig.API.V6}/members/autocomplete/${encodeURIComponent(term)}`,
    )
}

export async function getMemberByHandle(handle: string): Promise<{ userId: string; handle: string }> {
    return xhrGetAsync<{ userId: string; handle: string }>(
        `${EnvironmentConfig.API.V6}/members/${encodeURIComponent(handle)}?fields=userId,handle`,
    )
}

export async function getMembersByIds(userIds: string[]): Promise<Array<{ userId: string; handle: string }>> {
    if (!userIds.length) return []
    const query = qs.stringify(
        {
            fields: 'userId,handle',
            perPage: userIds.length,
            userIds,
        },
        { arrayFormat: userIds.length === 1 ? 'brackets' : 'repeat' },
    )
    return xhrGetAsync<Array<{ userId: string; handle: string }>>(
        `${EnvironmentConfig.API.V6}/members?${query}`,
    )
}

export const WinningsTypeOptions = [
    { label: 'Payment', value: 'PAYMENT' },
    { label: 'Reward', value: 'REWARD' },
]

// Static list from tc-finance-api prisma enum winnings_category
export const WinningsCategories: string[] = [
    'ALGORITHM_CONTEST_PAYMENT',
    'CONTRACT_PAYMENT',
    'PROBLEM_PAYMENT',
    'CODER_REFERRAL_PAYMENT',
    'CHARITY_PAYMENT',
    'COMPONENT_PAYMENT',
    'REVIEW_BOARD_PAYMENT',
    'ONE_OFF_PAYMENT',
    'BUG_FIXES_PAYMENT',
    'MARATHON_MATCH_PAYMENT',
    'DIGITAL_RUN_PAYMENT',
    'DIGITAL_RUN_ROOKIE_PAYMENT',
    'PROBLEM_TESTING_PAYMENT',
    'PROBLEM_WRITING_PAYMENT',
    'TOPCODER_STUDIO_CONTEST_PAYMENT',
    'LOGO_CONTEST_PAYMENT',
    'ARTICLE_PAYMENT',
    'CCIP_PAYMENT',
    'COMPONENT_TOURNAMENT_BONUS_PAYMENT',
    'ROYALTY_PAYMENT',
    'ALGORITHM_TOURNAMENT_PRIZE_PAYMENT',
    'RELIABILITY_BONUS_PAYMENT',
    'DIGITAL_RUN_TOP_PERFORMERS_PAYMENT',
    'ARCHITECTURE_REVIEW_PAYMENT',
    'SPECIFICATION_REVIEW_PAYMENT',
    'ASSEMBLY_COMPETITION_REVIEW',
    'ARCHITECTURE_PAYMENT',
    'PREDICTIVE_CONTEST_PAYMENT',
    'INTRODUCTORY_EVENT_COMPONENT_CONTEST_PAYMENT',
    'MARATHON_MATCH_TOURNAMENT_PRIZE_PAYMENT',
    'ASSEMBLY_PAYMENT',
    'TESTING_PAYMENT',
    'STUDIO_TOURNAMENT_PRIZE_PAYMENT',
    'HIGH_SCHOOL_TOURNAMENT_PRIZE_PAYMENT',
    'COLLEGE_TOUR_REPRESENTATIVE',
    'STUDIO_REVIEW_BOARD_PAYMENT',
    'COMPONENT_ENHANCEMENTS_PAYMENT',
    'REVIEW_BOARD_BONUS_PAYMENT',
    'COMPONENT_BUILD_PAYMENT',
    'DIGITAL_RUN_V2_PAYMENT',
    'DIGITAL_RUN_V2_TOP_PERFORMERS_PAYMENT',
    'SPECIFICATION_CONTEST_PAYMENT',
    'CONCEPTUALIZATION_CONTEST_PAYMENT',
    'TEST_SUITES_PAYMENT',
    'COPILOT_PAYMENT',
    'STUDIO_BUG_FIXES_PAYMENT',
    'STUDIO_ENHANCEMENTS_PAYMENT',
    'STUDIO_SPECIFICATION_REVIEW_PAYMENT',
    'UI_PROTOTYPE_COMPETITION_PAYMENT',
    'RIA_BUILD_COMPETITION_PAYMENT',
    'RIA_COMPONENT_COMPETITION_PAYMENT',
    'SPECIFICATION_WRITING_PAYMENT',
    'STUDIO_SPECIFICATION_WRITING_PAYMENT',
    'DEPLOYMENT_TASK_PAYMENT',
    'TEST_SCENARIOS_PAYMENT',
    'STUDIO_SUBMISSION_SCREENING_PAYMENT',
    'STUDIO_COPILOT_PAYMENT',
    'COPILOT_POSTING_PAYMENT',
    'CONTENT_CREATION_PAYMENT',
    'DIGITAL_RUN_V2_PAYMENT_TAXABLE',
    'DIGITAL_RUN_V2_TOP_PERFORMERS_PAYMENT_TAXABLE',
    'CONTEST_CHECKPOINT_PAYMENT',
    'CONTEST_PAYMENT',
    'MARATHON_MATCH_NON_TAXABLE_PAYMENT',
    'NEGATIVE_PAYMENT',
    'PROJECT_BUG_FIXES_PAYMENT',
    'PROJECT_COPILOT_PAYMENT',
    'PROJECT_DEPLOYMENT_TASK_PAYMENT',
    'PROJECT_ENHANCEMENTS_PAYMENT',
    'TASK_PAYMENT',
    'TASK_REVIEW_PAYMENT',
    'TASK_COPILOT_PAYMENT',
]

export function toReadableCategory(value: string): string {
    return value
        .split('_')
        .map(part => (part === part.toUpperCase() && part.length <= 3
            ? part // keep acronyms like UI, RIA
            : part.charAt(0) + part.slice(1)
                .toLowerCase()))
        .join(' ')
}
