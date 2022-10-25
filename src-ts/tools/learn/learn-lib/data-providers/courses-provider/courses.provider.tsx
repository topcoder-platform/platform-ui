import { get } from 'lodash'
import useSWR, { SWRResponse } from 'swr'
import { learnUrlGet } from '../../functions'

import { LearnCourse } from './courses-functions'
import { CoursesProviderData } from './courses-provider-data.model'

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

    const {data, error}: SWRResponse<ReadonlyArray<LearnCourse>> = useSWR(url)

    return {
        course: get(data, [0]),
        loading: !data && !error,
        ready: !!data || !!error,
    }
}
