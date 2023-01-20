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

export function useGetCACertification(
    certification: string,
    options?: TCACertificationsAllProviderOptions,
): TCACertificationsProviderData {

    const url: string = learnUrlGet(
        'topcoder-certifications',
        certification,
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
        dashedName: 'web-developmnt-fundamentals',
        description: 'The Web Developer Fundamentals certification will teach you the basics of HTML, CSS, javascript, front end libraries and will also introduce you to backend development.',
        introText: 'Introducing our Web Development fundamentals certification! Start your certification journey with Topcoder.',
        estimatedCompletionTime: 4,
        learnerLevel: 'Beginner',
        sequentialCourses: false,
        status: 'active',
        certificationCategoryId: '',
        skills: ['HTML', 'CSS', 'JavaScript', 'HTML1', 'CSS2', 'JavaScript2', 'HTML3', 'CSS3', 'JavaScript3', 'HTML4', 'CSS4', 'JavaScript4'],
        prerequisites: [],
        coursesCount: 4,
        providers: ['freecodecamp', 'topcoder'],
        learningOutcomes: [],
    },
    {
        id: 2,
        title: 'Data Science Fundamentals',
        dashedName: 'data-science-fundamentals',
        description: 'The Data Science Fundamentals certification will teach you the basics of scientific computing, Data Analysis and machine learning while using Python. Additionally, you will learn about data visualization.',
        introText: '',
        estimatedCompletionTime: 14,
        status: 'active',
        sequentialCourses: false,
        learnerLevel: 'Expert',
        certificationCategoryId: '',
        skills: ['Python', 'TensorFlow', 'JSON'],
        prerequisites: [],
        coursesCount: 4,
        providers: ['freecodecamp', 'topcoder'],
        learningOutcomes: [],
    }]

    return {
        certifications: data ?? [],
        error: false,
        loading: !data,
        ready: !!data,
    }
}

// TODO: remove when integrated with API
export function useGetTCACertificationMOCK(
    certification: string,
): TCACertificationsProviderData {
    const data: TCACertification[] = [{
        id: 1,
        title: 'Web Development Fundamentals',
        dashedName: 'web-developmnt-fundamentals',
        description: 'The Web Developer Fundamentals certification will teach you the basics of HTML, CSS, javascript, front end libraries and will also introduce you to backend development.',
        introText: 'Introducing our Web Development fundamentals certification! Start your certification journey with Topcoder.',
        estimatedCompletionTime: 4,
        learnerLevel: 'Beginner',
        sequentialCourses: false,
        status: 'active',
        certificationCategoryId: '',
        skills: ['HTML', 'CSS', 'JavaScript', 'HTML1', 'CSS2', 'JavaScript2', 'HTML3', 'CSS3', 'JavaScript3', 'HTML4', 'CSS4', 'JavaScript4'],
        prerequisites: [],
        coursesCount: 4,
        providers: ['freecodecamp', 'topcoder'],
        learningOutcomes: [
            'Fundamental skills required to begin a career in web development',
            'Introduction to React and other front end libraries - a jumping off point to build awesome websites',
            'Introduction to Java Script - one of the languages every web developer should know for web development and building basic algorithms and data structures',
            'Introduction to backend development with Node and APIs',
        ],
    }]

    return {
        certifications: data ?? [],
        error: false,
        loading: !data,
        ready: !!data,
    }
}
