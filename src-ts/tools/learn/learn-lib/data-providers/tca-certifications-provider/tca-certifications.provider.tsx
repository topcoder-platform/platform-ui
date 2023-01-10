/* eslint-disable max-len */
/* eslint-disable sort-keys */
/* eslint-disable default-param-last */
import useSWR, { SWRConfiguration, SWRResponse } from 'swr'

import { learnUrlGet } from '../../functions'
import { useSwrCache } from '../../learn-swr'

import { TCACertificationsProviderData } from './tca-certifications-provider-data.model'
import { TCACertification } from './tca-certification.model'

interface TCACertificationsAllProviderOptions {
    enabled?: boolean
}

export function useGetAllTCACertifications(
    options?: TCACertificationsAllProviderOptions,
): TCACertificationsProviderData {

    const url: string = learnUrlGet(
        'topcoder-certifications',
    )
    const swrCacheConfig: SWRConfiguration = useSwrCache(url)

    const { data, error }: SWRResponse = useSWR(url, {
        ...swrCacheConfig,
        isPaused: () => options?.enabled === false,
    })

    return {
        certifications: data ?? [],
        error: !!error,
        loading: !data,
        ready: !!data,
    }
}

// TODO: remove when integrated with API
export function useGetAllTCACertificationsMOCK(): TCACertificationsProviderData {
    const data: TCACertification[] = [{
        id: 1,
        title: 'Web Development Fundamentals',
        description: 'The Web Developer Fundamentals certification will teach you the basics of HTML, CSS, javascript, front end libraries and will also introduce you to backend development.',
        estimatedCompletionTime: 4,
        learnerLevel: 'Beginner',
        sequentialCourses: false,
        status: 'active',
        certificationCategoryId: '',
        skills: ['HTML', 'CSS', 'JavaScript', 'HTML', 'CSS', 'JavaScript', 'HTML', 'CSS', 'JavaScript', 'HTML', 'CSS', 'JavaScript', 'HTML', 'CSS', 'JavaScript'],
    },
    {
        id: 2,
        title: 'Data Science Fundamentals',
        description: 'The Data Science Fundamentals certification will teach you the basics of scientific computing, Data Analysis and machine learning while using Python. Additionally, you will learn about data visualization.',
        estimatedCompletionTime: 14,
        status: 'active',
        sequentialCourses: false,
        learnerLevel: 'Expert',
        certificationCategoryId: '',
        skills: ['Python', 'TensorFlow', 'JSON'],
    }]

    const error = {}

    return {
        certifications: data ?? [],
        error: !!error,
        loading: !data,
        ready: !!data,
    }
}
