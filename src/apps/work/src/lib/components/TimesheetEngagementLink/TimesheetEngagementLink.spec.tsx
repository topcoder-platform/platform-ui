/* eslint-disable import/no-extraneous-dependencies */
import { render, screen } from '@testing-library/react'

import { TimesheetEngagementLink } from './TimesheetEngagementLink'

jest.mock('~/libs/ui', () => ({
    IconOutline: {
        ExternalLinkIcon: () => <></>,
    },
}), {
    virtual: true,
})
jest.mock('../../constants', () => ({
    ENGAGEMENTS_APP_URL: 'https://engagements.test',
}))

describe('TimesheetEngagementLink', () => {
    it('links to the assignee timesheet in the Engagements Portal, in a new tab', () => {
        render(
            <TimesheetEngagementLink
                assignmentId='asg 1'
                engagementId='eng1'
                engagementTitle='Senior Frontend Engineer'
            />,
        )

        const link = screen.getByRole('link', { name: 'Senior Frontend Engineer' })

        expect(link.getAttribute('href'))
            .toBe('https://engagements.test/eng1/timesheets/asg%201')
        expect(link.getAttribute('target'))
            .toBe('_blank')
    })

    it('opens the timesheet on the given status filter', () => {
        render(
            <TimesheetEngagementLink
                assignmentId='asg1'
                engagementId='eng1'
                engagementTitle='Senior Frontend Engineer'
                status='APPROVED'
            />,
        )

        expect(screen.getByRole('link', { name: 'Senior Frontend Engineer' })
            .getAttribute('href'))
            .toBe('https://engagements.test/eng1/timesheets/asg1?status=APPROVED')
    })

    it('shows the plain name when the row cannot identify the timesheet', () => {
        render(<TimesheetEngagementLink engagementId='eng1' engagementTitle='Data Engineer' />)

        expect(screen.getByText('Data Engineer'))
            .toBeTruthy()
        expect(screen.queryByRole('link'))
            .toBeNull()
    })

    it('falls back to a dash without a title', () => {
        render(<TimesheetEngagementLink assignmentId='asg1' engagementId='eng1' engagementTitle='' />)

        expect(screen.getByRole('link', { name: '-' }))
            .toBeTruthy()
    })
})
