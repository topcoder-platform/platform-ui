/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import React from 'react'
import { render, screen } from '@testing-library/react'

import {
    ChallengeOpportunity,
    CopilotOpportunity,
    EngagementOpportunity,
    ReviewOpportunity,
} from '../models'

import {
    getMyWorkPages,
    MyWorkListing,
    MyWorkItem,
    myWorkMatchesStatus,
    myWorkState,
    myWorkStatuses,
    myWorkTrack,
    myWorkType,
} from './MyWorkListing'

jest.mock('~/libs/core', () => ({
    authUrlLogin: (): string => '/accounts?retUrl=opportunities',
}), { virtual: true })

jest.mock('~/config', () => ({
    EnvironmentConfig: { ENGAGEMENTS_URL: 'https://engagements.example' },
}), { virtual: true })

jest.mock('~/apps/copilots', () => ({
    absoluteRootRoute: 'https://platform.example/copilots',
}), { virtual: true })

jest.mock('~/libs/ui', () => {
    const Icon = (): undefined => undefined
    return {
        IconOutline: new Proxy({}, {
            get: () => Icon,
        }),
    }
}, { virtual: true })

jest.mock('../services', () => ({
    getOpportunityPage: jest.fn(),
}))

/**
 * Tags an owner-specific fixture for mixed My Work normalization tests.
 *
 * @param kind owning opportunity domain.
 * @param item minimal owning-API opportunity fixture.
 * @returns tagged item accepted by the My Work helpers.
 * @throws Does not throw.
 */
function workItem(kind: MyWorkItem['kind'], item: MyWorkItem['item']): MyWorkItem {
    return { item, kind }
}

describe('My Work normalization', () => {
    it('renders an authentication handoff without issuing member requests', () => {
        render(React.createElement(MyWorkListing, {
            kinds: [],
            onKindsChange: jest.fn(),
            onViewChange: jest.fn(),
            view: 'list',
        }))

        expect(screen.getByRole('heading', { name: 'Sign in to view your work' }))
            .toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Sign in' }))
            .toHaveAttribute('href', '/accounts?retUrl=opportunities')
    })

    it('maps the shared lifecycle filter to each owning API vocabulary', () => {
        expect(myWorkStatuses('competitions', 'active'))
            .toEqual(['ACTIVE'])
        expect(myWorkStatuses('engagements', 'active'))
            .toEqual(['OPEN', 'ACTIVE', 'ON_HOLD'])
        expect(myWorkStatuses('copilots', 'past'))
            .toEqual(['completed'])
        expect(myWorkStatuses('engagements', 'past'))
            .toEqual(['CANCELLED', 'CLOSED'])
        expect(myWorkStatuses('reviews', 'past'))
            .toEqual(['CLOSED'])
        expect(myWorkStatuses('reviews', 'all'))
            .toBeUndefined()
    })

    it('loads My Work engagements without server-side lifecycle status filters', async () => {
        const getOpportunityPageMock = jest.mocked(jest.requireMock('../services').getOpportunityPage)
        getOpportunityPageMock.mockResolvedValue({
            items: [],
            page: 1,
            perPage: 100,
            total: 0,
            totalPages: 0,
        })

        await getMyWorkPages('123', '', 'past', 'newest')

        const calls = getOpportunityPageMock.mock.calls as Array<[string, Record<string, unknown>]>
        const engagementCall = calls.find(([kind]) => kind === 'engagements')
        expect(engagementCall?.[1].statuses)
            .toBeUndefined()
        expect(calls.find(([kind]) => kind === 'competitions')?.[1].statuses)
            .toEqual(['COMPLETED'])
    })

    it('normalizes tracks and subtypes across all four owner payloads', () => {
        const competition = workItem('competitions', {
            id: 'challenge',
            name: 'Challenge',
            track: { name: 'Data Science' },
            type: { name: 'Marathon Match' },
        } as ChallengeOpportunity)
        const engagement = workItem('engagements', {
            id: 'engagement',
            role: 'SOFTWARE_DEVELOPER',
            title: 'Engagement',
        } as EngagementOpportunity)
        const copilot = workItem('copilots', {
            id: 'copilot',
            projectType: 'QA',
            type: 'Task',
        } as CopilotOpportunity)
        const review = workItem('reviews', {
            challengeData: { trackName: 'AI', type: 'First2Finish' },
            challengeId: 'challenge',
            id: 'review',
        } as ReviewOpportunity)

        expect(myWorkTrack(competition))
            .toBe('data-science')
        expect(myWorkType(competition))
            .toBe('marathon-match')
        expect(myWorkTrack(engagement))
            .toBe('development')
        expect(myWorkType(engagement))
            .toBe('gig')
        expect(myWorkTrack(copilot))
            .toBe('qa')
        expect(myWorkType(copilot))
            .toBe('task')
        expect(myWorkTrack(review))
            .toBe('ai')
        expect(myWorkType(review))
            .toBe('first2finish')
    })

    it('uses registered, engagement-status, and applied member-facing states', () => {
        expect(myWorkState(workItem('competitions', {
            id: 'challenge',
            name: 'Challenge',
        } as ChallengeOpportunity)))
            .toBe('Registered')
        expect(myWorkState(workItem('engagements', {
            applicationStatus: 'APPROVED',
            id: 'engagement',
            title: 'Engagement',
        } as EngagementOpportunity)))
            .toBe('Selected')
        expect(myWorkState(workItem('engagements', {
            applicationStatus: 'UNDER_REVIEW',
            id: 'engagement-review',
            title: 'Review engagement',
        } as EngagementOpportunity)))
            .toBe('Under Review')
        expect(myWorkState(workItem('engagements', {
            assignments: [{
                createdAt: '2026-02-10T11:00:00.000Z',
                id: 'assignment-completed',
                status: 'COMPLETED',
                updatedAt: '2026-02-12T11:00:00.000Z',
            }],
            id: 'engagement-completed',
            title: 'Completed engagement',
        } as EngagementOpportunity)))
            .toBe('Completed')
        expect(myWorkState(workItem('engagements', {
            id: 'engagement-hold',
            status: 'ON_HOLD',
            title: 'On hold engagement',
        } as EngagementOpportunity)))
            .toBe('On Hold')
        expect(myWorkState(workItem('copilots', {
            currentUserApplication: {
                createdAt: '2026-08-01',
                id: 'application',
                status: 'pending',
                updatedAt: '2026-08-01',
            },
            id: 'copilot',
        } as CopilotOpportunity)))
            .toBe('Applied')
        expect(myWorkState(workItem('reviews', {
            challengeId: 'approved-challenge',
            id: 'approved-review',
            myApplications: [{ status: 'APPROVED' }],
        } as ReviewOpportunity)))
            .toBe('Approved')
        expect(myWorkState(workItem('reviews', {
            challengeId: 'rejected-challenge',
            id: 'rejected-review',
            myApplications: [{ status: 'REJECTED' }],
        } as ReviewOpportunity)))
            .toBe('Rejected')
    })

    it('places engagement rows into active and past buckets by effective member status', () => {
        expect(myWorkMatchesStatus(workItem('engagements', {
            assignments: [{ status: 'COMPLETED' }],
            id: 'completed-active-lifecycle',
            status: 'ACTIVE',
            title: 'Completed active lifecycle',
        } as EngagementOpportunity), 'past'))
            .toBe(true)
        expect(myWorkMatchesStatus(workItem('engagements', {
            assignments: [{ status: 'TERMINATED' }],
            id: 'terminated-active-lifecycle',
            status: 'ACTIVE',
            title: 'Terminated active lifecycle',
        } as EngagementOpportunity), 'past'))
            .toBe(true)
        expect(myWorkMatchesStatus(workItem('engagements', {
            assignments: [{ status: 'OFFER_REJECTED' }],
            id: 'offer-rejected-active-lifecycle',
            status: 'ACTIVE',
            title: 'Offer rejected active lifecycle',
        } as EngagementOpportunity), 'past'))
            .toBe(true)
        expect(myWorkMatchesStatus(workItem('engagements', {
            applicationStatus: 'REJECTED',
            id: 'rejected-active-lifecycle',
            status: 'ACTIVE',
            title: 'Rejected active lifecycle',
        } as EngagementOpportunity), 'past'))
            .toBe(true)
        expect(myWorkMatchesStatus(workItem('engagements', {
            applicationStatus: 'UNDER_REVIEW',
            id: 'under-review-closed-lifecycle',
            status: 'CLOSED',
            title: 'Under review closed lifecycle',
        } as EngagementOpportunity), 'active'))
            .toBe(true)
        expect(myWorkMatchesStatus(workItem('engagements', {
            id: 'closed-without-member-status',
            status: 'CLOSED',
            title: 'Closed fallback lifecycle',
        } as EngagementOpportunity), 'past'))
            .toBe(true)
        expect(myWorkMatchesStatus(workItem('engagements', {
            id: 'open-without-member-status',
            status: 'OPEN',
            title: 'Open fallback lifecycle',
        } as EngagementOpportunity), 'active'))
            .toBe(true)
    })
})
