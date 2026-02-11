import useSWR, { SWRResponse } from 'swr'

import { Submission } from '../models'
import { fetchSubmissionVersions } from '../services'

export interface UseFetchSubmissionVersionsResult {
    error: Error | undefined
    isError: boolean
    isLoading: boolean
    versions: Submission[]
}

export function useFetchSubmissionVersions(
    challengeId?: string,
    memberId?: string,
    currentSubmissionId?: string,
    submissionType?: Submission['type'],
): UseFetchSubmissionVersionsResult {
    const normalizedCurrentSubmissionId = currentSubmissionId?.trim() || undefined
    const normalizedSubmissionType = submissionType?.trim() || undefined

    const swrKey = challengeId && memberId
        ? [
            'submission-versions',
            challengeId,
            memberId,
            normalizedCurrentSubmissionId || '',
            normalizedSubmissionType || '',
        ]
        : undefined

    const {
        data,
        error,
    }: SWRResponse<Submission[], Error> = useSWR<Submission[], Error>(
        swrKey,
        async () => {
            const versions = await fetchSubmissionVersions(
                challengeId as string,
                memberId as string,
            )

            const versionsByType = normalizedSubmissionType
                ? versions.filter(version => version.type === normalizedSubmissionType)
                : versions

            if (!normalizedCurrentSubmissionId) {
                return versionsByType
            }

            return versionsByType.filter(version => version.id !== normalizedCurrentSubmissionId)
        },
        {
            errorRetryCount: 2,
            shouldRetryOnError: true,
        },
    )

    return {
        error,
        isError: !!error,
        isLoading: !!challengeId && !!memberId && !data && !error,
        versions: data || [],
    }
}

export default useFetchSubmissionVersions
