/* eslint-disable import/no-extraneous-dependencies */
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'

import { ActiveMembersDashboard } from '../../lib/services'

import { ActiveMembersDetails } from './ActiveMembersDetails'

const response: ActiveMembersDashboard = {
    dashboard: 'active-members',
    endDate: '2026-04-01T00:00:00.000Z',
    months: [
        {
            activities: [
                {
                    activity: 'payment',
                    date: '2026-02-21T12:00:00.000Z',
                    description: 'Challenge prize',
                    handle: 'same-member',
                    id: 'payment:1',
                    memberId: '1',
                },
                {
                    activity: 'engagement-application',
                    date: '2026-02-01T00:00:00.000Z',
                    description: 'Developer engagement',
                    handle: 'same-member',
                    id: 'application:1',
                    memberId: '1',
                },
            ],
            month: '2026-02-01',
            totalUniqueMembers: 1,
        },
        { activities: [], month: '2026-03-01', totalUniqueMembers: 0 },
    ],
    startDate: '2026-02-01T00:00:00.000Z',
    summary: { totalUniqueMembers: 1 },
}

describe('ActiveMembersDetails', () => {
    it('shows unique totals above member activity, with newest months and dates first', () => {
        render(<ActiveMembersDetails response={response} />)
        const headings = screen.getAllByRole('heading', { level: 3 })
        expect(headings[0])
            .toHaveTextContent('Mar ’26 — 0 active members')
        expect(headings[1])
            .toHaveTextContent('Feb ’26 — 1 active members')
        expect(screen.getByText('No member activity for this month.'))
            .toBeInTheDocument()
        const rows = within(screen.getByRole('table'))
            .getAllByRole('row')
        expect(rows)
            .toHaveLength(3)
        expect(rows[1])
            .toHaveTextContent('2026-02-21 12:00:00same-memberPayment receivedChallenge prize')
        expect(rows[2])
            .toHaveTextContent('2026-02-01 00:00:00same-memberEngagement applicationDeveloper engagement')
        expect(response.months[0].month)
            .toBe('2026-02-01')
    })
})
