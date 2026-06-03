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
})
