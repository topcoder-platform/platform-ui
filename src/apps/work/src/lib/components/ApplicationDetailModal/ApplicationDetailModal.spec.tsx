/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { render, screen } from '@testing-library/react'

import type { Application } from '../../models'

import ApplicationDetailModal from './ApplicationDetailModal'

jest.mock('~/libs/core', () => ({
    downloadProfileAsync: jest.fn(),
}), {
    virtual: true,
})
jest.mock('~/libs/ui', () => ({
    BaseModal: (props: {
        buttons?: JSX.Element
        children: JSX.Element
        open: boolean
        title: string
    }): JSX.Element => (
        props.open ? (
            <div aria-label={props.title} role='dialog'>
                {props.children}
                {props.buttons}
            </div>
        ) : <></>
    ),
    Button: (props: {
        label: string
        onClick: () => void
    }): JSX.Element => (
        <button onClick={props.onClick} type='button'>
            {props.label}
        </button>
    ),
    IconSolid: {
        DownloadIcon: (): JSX.Element => <span>download-icon</span>,
    },
}), {
    virtual: true,
})
jest.mock('../../constants', () => ({
    PROFILE_URL: 'https://profiles.example.com',
}))

describe('ApplicationDetailModal', () => {
    const application: Application = {
        address: 'Address121, Osaka',
        availability: 'Immediate availability',
        createdAt: '2026-03-31T15:39:00.000Z',
        email: 'topcodergh+testaws1@gmail.com',
        engagementId: 'engagement-1',
        handle: 'testaws1',
        id: 'application-1',
        name: 'Testaws test',
        status: 'SUBMITTED',
        userId: '12345',
        yearsOfExperience: 15,
    }

    it('renders the address field when application details include one', () => {
        render(
            <ApplicationDetailModal
                application={application}
                onClose={jest.fn()}
                open
            />,
        )

        expect(screen.getByText('Address'))
            .toBeTruthy()
        expect(screen.getByText('Address121, Osaka'))
            .toBeTruthy()
    })

    it('links to the uploaded CV without showing the legacy resume/profile link', () => {
        render(
            <ApplicationDetailModal
                application={{
                    ...application,
                    cvFileUrl: 'https://cdn.filestackcontent.com/cv-handle',
                    resumeUrl: 'https://www.linkedin.com/in/testaws1',
                }}
                onClose={jest.fn()}
                open
            />,
        )

        expect(screen.getByRole('link', { name: 'View CV' })
            .getAttribute('href'))
            .toBe('https://cdn.filestackcontent.com/cv-handle')
        expect(screen.queryByText('Resume / Profile Link'))
            .toBeNull()
        expect(screen.queryByRole('link', { name: 'https://www.linkedin.com/in/testaws1' }))
            .toBeNull()
    })

    it('shows the expected pay rate and referral source instead of years of experience', () => {
        render(
            <ApplicationDetailModal
                application={{
                    ...application,
                    expectedPayRate: '$50/hour',
                    referralSource: 'Topcoder newsletter',
                }}
                onClose={jest.fn()}
                open
            />,
        )

        expect(screen.getByText('Expected pay rate'))
            .toBeTruthy()
        expect(screen.getByText('$50/hour'))
            .toBeTruthy()
        expect(screen.getByText('How did you come to know of the opportunity?'))
            .toBeTruthy()
        expect(screen.getByText('Topcoder newsletter'))
            .toBeTruthy()
        expect(screen.queryByText('Experience (years)'))
            .toBeNull()
    })

    it('shows a dash when no referral source was entered', () => {
        render(
            <ApplicationDetailModal
                application={application}
                onClose={jest.fn()}
                open
            />,
        )

        const label = screen.getByText('How did you come to know of the opportunity?')
        expect(label.nextElementSibling?.textContent)
            .toBe('-')
    })
})
