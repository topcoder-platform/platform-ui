/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, sort-keys */
import '@testing-library/jest-dom'

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

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

jest.mock('rehype-raw', () => ({
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
    standardHoursPerDay: 7.5,
    status: 'assigned',
    createdAt: '2026-03-25T00:00:00.000Z',
    updatedAt: '2026-03-25T00:00:00.000Z',
}

describe('AssignmentCard', () => {
    it.each(['assigned', 'completed', 'terminated'])(
        'allows documenting experience for an %s assignment',
        async status => {
            const user = userEvent.setup()
            const onDocumentExperience = jest.fn()
            const onOpenTimesheet = jest.fn()

            render(
                <AssignmentCard
                    engagement={engagement}
                    assignment={{ ...assignment, status }}
                    onViewPayments={jest.fn()}
                    onDocumentExperience={onDocumentExperience}
                    onOpenTimesheet={onOpenTimesheet}
                    onContactTalentManager={jest.fn()}
                />,
            )

            await user.click(screen.getByRole('button', { name: 'Document Experience' }))

            expect(onDocumentExperience)
                .toHaveBeenCalledTimes(1)
            expect(onOpenTimesheet)
                .not.toHaveBeenCalled()

            if (status === 'assigned') {
                await user.click(screen.getByRole('button', { name: 'Timesheet' }))
                expect(onOpenTimesheet)
                    .toHaveBeenCalledTimes(1)
                expect(onDocumentExperience)
                    .toHaveBeenCalledTimes(1)
            } else {
                expect(screen.queryByRole('button', { name: 'Timesheet' }))
                    .not.toBeInTheDocument()
            }
        },
    )

    it('does not allow documenting experience before an offer is accepted', () => {
        render(
            <AssignmentCard
                engagement={engagement}
                assignment={{ ...assignment, status: 'selected' }}
                onViewPayments={jest.fn()}
                onDocumentExperience={jest.fn()}
                onOpenTimesheet={jest.fn()}
                onContactTalentManager={jest.fn()}
            />,
        )

        expect(screen.queryByRole('button', { name: 'Document Experience' })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Timesheet' })).not.toBeInTheDocument()
    })

    it('formats the hourly rate with two decimal places and displays daily standard hours', () => {
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
        expect(screen.getByText('Std hrs / day: 7.5 hrs'))
            .toBeInTheDocument()
    })
})
