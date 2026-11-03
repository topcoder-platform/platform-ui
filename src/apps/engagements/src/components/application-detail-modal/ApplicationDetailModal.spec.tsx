/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'

import { render, screen } from '@testing-library/react'

import type { Application } from '../../lib/models'
import { ApplicationStatus } from '../../lib/models'

import ApplicationDetailModal from './ApplicationDetailModal'

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: { children: React.ReactNode, open: boolean }) => (
        props.open ? <div role='dialog'>{props.children}</div> : <></>
    ),
    Button: (props: { label: string, onClick?: () => void }) => (
        <button onClick={props.onClick} type='button'>{props.label}</button>
    ),
}), { virtual: true })

const application: Application = {
    availability: 'Immediately',
    createdAt: '2026-10-28T00:00:00.000Z',
    cvFileUrl: 'https://files.example.com/cv.pdf',
    email: 'jane@example.com',
    engagementId: 'eng-1',
    id: 'app-1',
    name: 'Jane Doe',
    portfolioUrls: ['https://portfolio.example.com'],
    status: ApplicationStatus.SUBMITTED,
    updatedAt: '2026-10-28T00:00:00.000Z',
    userHandle: 'jane',
    userId: 1,
}

describe('ApplicationDetailModal', () => {
    it('does not show the portfolio, which the application form no longer collects', () => {
        render(<ApplicationDetailModal application={application} onClose={jest.fn()} open />)

        expect(screen.getByText('View CV'))
            .toBeInTheDocument()
        expect(screen.queryByText('Portfolio'))
            .not
            .toBeInTheDocument()
        expect(screen.queryByText('https://portfolio.example.com'))
            .not
            .toBeInTheDocument()
    })
})
