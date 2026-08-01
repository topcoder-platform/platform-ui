/**
 * Fetch challenge info
 */

import {
    useEffect,
} from 'react'
import useSWR, { SWRResponse } from 'swr'

import { handleError } from '~/apps/admin/src/lib/utils'

import type {
    ChallengeInfo,
} from '../models'
import { fetchChallengeInfoById } from '../services'

const CHECKPOINT_REVIEW_PHASE_NAME = 'checkpoint review'
const CHECKPOINT_WINNER_REFRESH_INTERVAL_MS = 10_000

/**
 * Select the challenge-info polling interval used while checkpoint winners are pending.
 * The Challenge API intentionally hides checkpoint winners until Checkpoint Review closes,
 * so active pages poll during that phase and stop as soon as the refreshed response changes.
 *
 * @param challengeInfo latest challenge response held by SWR
 * @returns polling interval in milliseconds, or zero when no refresh is needed
 */
export function getChallengeInfoRefreshInterval(
    challengeInfo?: ChallengeInfo,
): number {
    const isActive = challengeInfo?.status?.trim()
        .toUpperCase() === 'ACTIVE'
    const hasCheckpointWinners = Boolean(challengeInfo?.checkpointWinners?.length)
    const hasOpenCheckpointReview = challengeInfo?.phases?.some(phase => (
        phase.isOpen === true
        && phase.name?.trim()
            .toLowerCase() === CHECKPOINT_REVIEW_PHASE_NAME
    )) ?? false

    return isActive && !hasCheckpointWinners && hasOpenCheckpointReview
        ? CHECKPOINT_WINNER_REFRESH_INTERVAL_MS
        : 0
}

export interface useFetchChallengeInfoProps {
    challengeInfo: ChallengeInfo | undefined
    error: Error | undefined
    isError: boolean
    isLoading: boolean
    retry: () => Promise<ChallengeInfo | undefined>
}

/**
 * Fetch challenge info
 * @param challengeId challenge id
 * @returns challenge info
 */
export function useFetchChallengeInfo(
    challengeId?: string,
): useFetchChallengeInfoProps {
    // Use swr hooks for challenge info fetching
    const {
        data: challengeInfo,
        error: fetchChallengeInfoError,
        isValidating: isLoading,
        mutate,
    }: SWRResponse<ChallengeInfo, Error> = useSWR<ChallengeInfo, Error>(
        `challengeBaseUrl/challenges/${challengeId}`,
        {
            fetcher: () => fetchChallengeInfoById(challengeId ?? ''),
            isPaused: () => !challengeId,
            refreshInterval: getChallengeInfoRefreshInterval,
        },
    )

    // Show backend error when fetching challenge info
    useEffect(() => {
        if (fetchChallengeInfoError) {
            handleError(fetchChallengeInfoError)
        }
    }, [fetchChallengeInfoError])

    return {
        challengeInfo: fetchChallengeInfoError
            ? undefined
            : challengeInfo,
        error: fetchChallengeInfoError,
        isError: !!fetchChallengeInfoError,
        isLoading,
        retry: () => mutate(),
    }
}
