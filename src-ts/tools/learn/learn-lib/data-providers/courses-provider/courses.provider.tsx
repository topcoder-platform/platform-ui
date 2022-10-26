import { get } from 'lodash'
import useSWR, { SWRConfiguration, SWRResponse } from 'swr'

import { learnUrlGet } from '../../functions'
import { useSwrCache } from '../../learn-swr'

import { CoursesProviderData } from './courses-provider-data.model'
import { LearnCourse } from './learn-course.model'

export function useGetCourses(
    provider: string,
    certification?: string
): CoursesProviderData {

    const params: string = [
        `certification=${certification}`,
        `provider=${provider}`,
    ]
        .filter(Boolean)
        .join('&')

    const url: string = learnUrlGet('courses', `?${params}`)
    const swrCacheConfig: SWRConfiguration = useSwrCache(url)

    const {data, error}: SWRResponse<ReadonlyArray<LearnCourse>> = useSWR(url, swrCacheConfig)

    return {
        course: get(data, [0]),
        loading: !data && !error,
        ready: !!data || !!error,
    }
}
