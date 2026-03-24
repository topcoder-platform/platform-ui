/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, sort-keys */
import '@testing-library/jest-dom'

import React from 'react'
import { render, screen } from '@testing-library/react'

import type { Engagement, EngagementAssignment } from '../../lib/models'
import { EngagementStatus } from '../../lib/models'

import AssignmentCard from './AssignmentCard'

jest.mock('react-markdown', () => ({
    __esModule: true,
    default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

jest.mock('remark-frontmatter', () => ({
    __esModule: true,
    default: jest.fn(),
}))

jest.mock('remark-gfm', () => ({
    __esModule: true,
    default: jest.fn(),
}))

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        URLS: {
            USER_PROFILE: 'https://topcoder.com/members',
        },
    },
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    Button: (props: {
        className?: string
        disabled?: boolean
        label: string
        onClick?: () => void
    }) => (
        <button
            type='button'
            className={props.className}
            disabled={props.disabled}
            onClick={props.onClick}
        >
            {props.label}
        </button>
    ),
    IconSolid: {
        CalendarIcon: () => <span />,
        ClockIcon: () => <span />,
        CurrencyDollarIcon: () => <span />,
        GlobeAltIcon: () => <span />,
        LocationMarkerIcon: () => <span />,
    },
}), { virtual: true })

const engagement: Engagement = {
    id: 'engagement-1',
    nanoId: 'engagement-1-nano',
    projectId: 'project-1',
    title: 'QA Assignment',
    description: 'Test description',
    duration: {},
    timeZones: ['America/New_York'],
    countries: ['US'],
    requiredSkills: ['Testing'],
    status: EngagementStatus.OPEN,
    createdAt: '2026-03-25T00:00:00.000Z',
    updatedAt: '2026-03-25T00:00:00.000Z',
    createdBy: 'manager',
}

const assignment: EngagementAssignment = {
    id: 'assignment-1',
    engagementId: 'engagement-1',
    memberId: 'member-1',
    memberHandle: 'member',
    ratePerHour: '20.3',
    standardHoursPerWeek: 40,
    status: 'assigned',
    createdAt: '2026-03-25T00:00:00.000Z',
    updatedAt: '2026-03-25T00:00:00.000Z',
}

describe('AssignmentCard', () => {
    it('formats the hourly rate with two decimal places', () => {
        render(
            <AssignmentCard
                engagement={engagement}
                assignment={assignment}
                onViewPayments={jest.fn()}
                onDocumentExperience={jest.fn()}
                onContactTalentManager={jest.fn()}
            />,
        )

        expect(screen.getByText('Rate / hr: $20.30'))
            .toBeInTheDocument()
    })
})
