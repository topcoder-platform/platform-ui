/* eslint-disable max-len */
/* eslint-disable sort-keys */
/* eslint-disable default-param-last */
import useSWR, { SWRConfiguration, SWRResponse } from 'swr'

import { LEARN_PATHS } from '../../../learn.routes'
import { learnUrlGet } from '../../functions'
import { useSwrCache } from '../../learn-swr'

import { TCACertificationProviderData, TCACertificationsProviderData } from './tca-certifications-provider-data.model'
import { TCACertification } from './tca-certification.model'
import { find } from 'lodash'

interface TCACertificationsAllProviderOptions {
    enabled?: boolean
}

const TCACertificationMock: TCACertification[] = [{
    id: 1,
    title: 'Web Development Fundamentals',
    dashedName: 'web-development-fundamentals',
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
    dashedName: 'data-science-fundamentals',
    description: 'The Data Science Fundamentals certification will teach you the basics of scientific computing, Data Analysis and machine learning while using Python. Additionally, you will learn about data visualization.',
    estimatedCompletionTime: 14,
    status: 'active',
    sequentialCourses: false,
    learnerLevel: 'Expert',
    certificationCategoryId: '',
    skills: ['Python', 'TensorFlow', 'JSON'],
}]

export function useGetAllTCACertifications(
    options?: TCACertificationsAllProviderOptions,
): TCACertificationsProviderData {

    const url: string = learnUrlGet(
        LEARN_PATHS.tcaCertifications,
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

export function useGetTCACertification(
    certification: string,
    options?: TCACertificationsAllProviderOptions,
): TCACertificationProviderData {

    const url: string = learnUrlGet(
        LEARN_PATHS.tcaCertifications,
        certification,
    )
    const swrCacheConfig: SWRConfiguration = useSwrCache(url)

    const { data, error }: SWRResponse = useSWR(url, {
        ...swrCacheConfig,
        isPaused: () => options?.enabled === false,
    })

    return {
        certification: data,
        error: !!error,
        loading: !data,
        ready: !!data,
    }
}

// TODO: remove when integrated with API
export function useGetTCACertificationMOCK(
    certification: string,
): TCACertificationProviderData {

    const data: TCACertification | undefined = find(TCACertificationMock, { dashedName: certification })

    return {
        certification: data,
        error: false,
        loading: !data,
        ready: !!data,
    }
}

// TODO: remove when integrated with API
export function useGetAllTCACertificationsMOCK(): TCACertificationsProviderData {
    return {
        certifications: TCACertificationMock ?? [],
        error: false,
        loading: !TCACertificationMock,
        ready: !!TCACertificationMock,
    }
}
