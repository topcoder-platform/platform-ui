/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'

import { SupportTicketSummary } from '../../models'

import { TicketsTable } from './TicketsTable'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        URLS: {
            CHALLENGES_PAGE: 'https://www.example.test/challenges',
            USER_PROFILE: 'https://profiles.example.test',
        },
    },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    UserRole: { topcoderSupportTeam: 'Topcoder Support Team' },
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    Button: (props: {
        disabled?: boolean
        label: string
        onClick?: (event: React.MouseEvent) => void
    }): JSX.Element => (
        <button disabled={props.disabled} onClick={props.onClick} type='button'>
            {props.label}
        </button>
    ),
    LinkButton: (props: {
        label: string
        onClick?: (event: React.MouseEvent) => void
        rel?: string
        target?: string
        to: string
    }): JSX.Element => (
        <a
            href={props.to}
            onClick={props.onClick}
            rel={props.rel}
            target={props.target}
        >
            {props.label}
        </a>
    ),
}), { virtual: true })

const baseTicket: SupportTicketSummary = {
    assignees: [],
    challengeId: 'challenge/id',
    description: 'Unable to submit',
    hasUnread: false,
    id: 'ticket-1',
    latestActivityAt: '2026-08-07T00:00:00.000Z',
    memberHandle: 'member',
    memberUserId: '12345',
    openedAt: '2026-08-07T00:00:00.000Z',
    responseCount: 1,
    status: 'OPEN',
    updatedAt: '2026-08-07T00:00:00.000Z',
}

describe('TicketsTable challenge links', () => {
    it('renders encoded link buttons in both responsive views without opening the ticket row', () => {
        const onOpen = jest.fn()
        render(
            <TicketsTable
                isSupportTeam={false}
                onAssign={jest.fn()}
                onOpen={onOpen}
                tickets={[baseTicket]}
            />,
        )

        const challengeLinks = screen.getAllByRole('link', { name: 'View challenge' })
        expect(challengeLinks)
            .toHaveLength(2)
        challengeLinks.forEach(link => {
            expect(link.getAttribute('href'))
                .toBe('https://www.example.test/challenges/challenge%2Fid')
        })
        expect(screen.queryByText('challenge/id'))
            .toBeNull()

        fireEvent.click(challengeLinks[0])
        expect(onOpen)
            .not.toHaveBeenCalled()

        fireEvent.click(screen.getByLabelText('Read ticket: Unable to submit'))
        expect(onOpen)
            .toHaveBeenCalledWith(baseTicket)
    })

    it('does not render a challenge link when the ticket has no association', () => {
        render(
            <TicketsTable
                isSupportTeam={false}
                onAssign={jest.fn()}
                onOpen={jest.fn()}
                tickets={[{ ...baseTicket, challengeId: undefined }]}
            />,
        )

        expect(screen.queryByRole('link', { name: 'View challenge' }))
            .toBeNull()
    })
})

describe('TicketsTable unread indicators', () => {
    const unreadTicket: SupportTicketSummary = {
        ...baseTicket,
        assignees: [{
            assignedAt: '2026-08-07T00:00:00.000Z',
            handle: 'support-member',
            userId: 'staff-1',
        }],
        hasUnread: true,
        status: 'CLOSED',
    }

    it('shows unread indicators to the assigned support team member', () => {
        render(
            <TicketsTable
                currentUserId='staff-1'
                isSupportTeam
                onAssign={jest.fn()}
                onOpen={jest.fn()}
                tickets={[unreadTicket]}
            />,
        )

        expect(screen.getAllByText('Unread'))
            .toHaveLength(2)
        expect(screen.getByLabelText('Unread ticket: Unable to submit'))
            .toHaveClass('unread')
    })

    it('hides unread indicators from support team members who are not assigned', () => {
        render(
            <TicketsTable
                currentUserId='staff-2'
                isSupportTeam
                onAssign={jest.fn()}
                onOpen={jest.fn()}
                tickets={[unreadTicket]}
            />,
        )

        expect(screen.queryByText('Unread'))
            .toBeNull()
        expect(screen.getByLabelText('Read ticket: Unable to submit'))
            .not.toHaveClass('unread')
    })

    it('preserves unread indicators for an ordinary member', () => {
        render(
            <TicketsTable
                isSupportTeam={false}
                onAssign={jest.fn()}
                onOpen={jest.fn()}
                tickets={[{ ...unreadTicket, assignees: [] }]}
            />,
        )

        expect(screen.getAllByText('Unread'))
            .toHaveLength(2)
        expect(screen.getByLabelText('Unread ticket: Unable to submit'))
            .toHaveClass('unread')
    })
})
