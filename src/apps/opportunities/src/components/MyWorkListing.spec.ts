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
    MyWorkListing,
    MyWorkItem,
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
})
