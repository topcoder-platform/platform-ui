import useSWR, { SWRResponse } from 'swr'

import { TimelineTemplate } from '../models'
import { fetchTimelineTemplates } from '../services'

export interface UseFetchTimelineTemplatesResult {
    timelineTemplates: TimelineTemplate[]
    isLoading: boolean
    isError: boolean
    error: Error | undefined
    mutate: SWRResponse<TimelineTemplate[], Error>['mutate']
}

export function useFetchTimelineTemplates(): UseFetchTimelineTemplatesResult {
    const {
        data,
        error,
        mutate,
    }: SWRResponse<TimelineTemplate[], Error>
        = useSWR<TimelineTemplate[], Error>(
            'work/timeline-templates',
            fetchTimelineTemplates,
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        error,
        isError: !!error,
        isLoading: !data && !error,
        mutate,
        timelineTemplates: data || [],
    }
}
