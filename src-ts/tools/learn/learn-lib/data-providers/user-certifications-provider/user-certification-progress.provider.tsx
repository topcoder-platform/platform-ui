import { find } from 'lodash'
import useSWR, { SWRResponse } from 'swr'
import { learnUrlGet } from '../../functions'

import { UserCertificationProgressProviderData } from './user-certification-progress-provider-data.model'
import { LearnUserCertificationProgress } from './user-certifications-functions'

export function useGetUserCertificationProgress(userId?: number, provider?: string, certification?: string):
    UserCertificationProgressProviderData {

    const params: string = [
        `?userId=${userId}`,
        provider && `provider=${provider}`,
        certification && `certification=${certification}`,
    ]
        .filter(Boolean)
        .join('&')

    const url: string = learnUrlGet('certification-progresses', params)

    const { data, error, mutate }: SWRResponse<ReadonlyArray<LearnUserCertificationProgress>> = useSWR(url, {
        isPaused: () => !userId || !certification
    })

    return {
        certificationProgress: find(data, {certification}),
        loading: !!userId && !data && !error,
        ready: !userId || data || error,
        refetch: () => mutate(),
        setCertificateProgress: (progress) => mutate([progress])
    };
}
