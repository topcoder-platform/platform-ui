/* eslint-disable max-len */
/* eslint-disable sort-keys */
/* eslint-disable default-param-last */
import { find } from 'lodash'
import useSWR, { SWRConfiguration, SWRResponse } from 'swr'

import { LEARN_PATHS } from '../../../learn.routes'
import { learnUrlGet } from '../../functions'
import { useSwrCache } from '../../learn-swr'

import { TCACertificationProviderData, TCACertificationsProviderData } from './tca-certifications-provider-data.model'
import { TCACertification } from './tca-certification.model'

interface TCACertificationsAllProviderOptions {
    enabled?: boolean
}

const TCACertificationMock: TCACertification[] = [{
    id: 1,
    title: 'Web Development Fundamentals',
    dashedName: 'web-developmnt-fundamentals',
    description: 'The Web Developer Fundamentals certification will teach you the basics of HTML, CSS, javascript, front end libraries and will also introduce you to backend development.',
    introText: 'Introducing our Web Development fundamentals certification! Start your certification journey with Topcoder.',
    estimatedCompletionTime: 4,
    learnerLevel: 'Beginner',
    sequentialCourses: false,
    status: 'active',
    certificationCategory: {
        id: 1,
        category: 'Web Development',
        track: 'DEV',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    certificationCategoryId: '',
    skills: ['HTML', 'CSS', 'JavaScript', 'HTML1', 'CSS2', 'JavaScript2', 'HTML3', 'CSS3', 'JavaScript3', 'HTML4', 'CSS4', 'JavaScript4'],
    prerequisites: [],
    coursesCount: 4,
    resourceProviders: [],
    certificationResources: [{
        id: 1,
        topcoderCertificationId: 1,
        resourceProviderId: 1,
        resourceableId: 1,
        resourceableType: 'FreeCodeCampCertification',
        displayOrder: 0,
        completionOrder: 0,
        resourceDescription: 'The fundamentals of responsive web design',
        resourceTitle: 'Responsive Web Design',
        createdAt: new Date('2023-01-26T14:08:11.883Z'),
        updatedAt: new Date('2023-01-26T14:08:11.883Z'),
        freeCodeCampCertification: {
            fccId: '9bd93a8a-1fcb-405a-b2e3-4a283915bbca',
        },
    }],
    providers: [{
        id: 1,
        name: 'freeCodeCamp',
        description: 'Free courses about programming and some such',
        url: 'freeCodeCamp.org',
    }, {
        id: 2,
        name: 'Topcoder',
        description: '',
        url: 'topcoder.org',
    }],
    createdAt: new Date(),
    updatedAt: new Date(),
    stripeProductId: '1',
    learningOutcomes: [
        'Fundamental skills required to begin a career in web development',
        'Introduction to React and other front end libraries - a jumping off point to build awesome websites',
        'Introduction to Java Script - one of the languages every web developer should know for web development and building basic algorithms and data structures',
        'Introduction to backend development with Node and APIs',
    ],
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
    resourceProviders: [],
    certificationResources: [],
    providers: [{
        id: 1,
        name: 'freeCodeCamp',
        description: 'Free courses about programming and some such',
        url: 'freeCodeCamp.org',
    }],
    learningOutcomes: ['Python', 'TensorFlow', 'JSON'],
    createdAt: new Date(),
    updatedAt: new Date(),
    stripeProductId: '1',
    certificationCategory: {
        id: 1,
        category: 'Data Science',
        track: 'DATASCIENCE',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
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
export function useGetAllTCACertificationsMOCK(): TCACertificationsProviderData {
    return {
        certifications: [...TCACertificationMock],
        error: false,
        loading: false,
        ready: true,
    }
}

// TODO: remove when integrated with API
export function useGetTCACertificationMOCK(
    certification: string,
): TCACertificationProviderData {

    const data: TCACertification | undefined = find(TCACertificationMock, { dashedName: certification })

    return {
        certification: data as TCACertification,
        error: false,
        loading: !data,
        ready: !!data,
    }
}
