/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import type { Application } from '../../models'

import ApplicationDetailModal from './ApplicationDetailModal'

const mockProfileGetPublicAsync = jest.fn()

jest.mock('~/libs/core', () => ({
    downloadProfileAsync: jest.fn(),
    profileGetPublicAsync: (handle: string) => mockProfileGetPublicAsync(handle),
    useCountryName: (code?: string) => (code === 'JP' ? 'Japan' : undefined),
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
    beforeEach(() => {
        mockProfileGetPublicAsync.mockReset()
        mockProfileGetPublicAsync.mockResolvedValue(undefined)
    })

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

        expect(screen.getByRole('link', { name: 'Download' })
            .getAttribute('href'))
            .toBe('https://cdn.filestackcontent.com/cv-handle')
        expect(screen.getByRole('link', { name: 'Preview CV' }))
            .toBeTruthy()
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

        expect(screen.getByText('Expected Pay Rate (USD/Hour)'))
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

    it('shows the mobile number and the member location from the profile', async () => {
        mockProfileGetPublicAsync.mockResolvedValue({
            addresses: [{ city: 'Osaka' }],
            homeCountryCode: 'JP',
        })

        render(
            <ApplicationDetailModal
                application={{ ...application, mobileNumber: '+81 555 1234' }}
                onClose={jest.fn()}
                open
            />,
        )

        expect(screen.getByText('+81 555 1234'))
            .toBeTruthy()
        expect(await screen.findByText('Osaka, Japan'))
            .toBeTruthy()
        expect(mockProfileGetPublicAsync)
            .toHaveBeenCalledWith('testaws1')
    })

    it('opens a PDF CV preview in a new tab instead of downloading it', async () => {
        const originalFetch = global.fetch
        const originalCreateObjectURL = URL.createObjectURL
        const previewWindow = {
            document: { body: {}, title: '' },
            location: { href: '' },
            opener: {},
        }
        const openSpy = jest.spyOn(window, 'open')
            .mockReturnValue(previewWindow as unknown as Window)
        global.fetch = jest.fn()
            .mockResolvedValue({
                blob: () => Promise.resolve(new Blob(['%PDF'], { type: 'application/pdf' })),
                ok: true,
            }) as unknown as typeof fetch
        URL.createObjectURL = jest.fn(() => 'blob:cv-preview')

        try {
            render(
                <ApplicationDetailModal
                    application={{ ...application, cvFileUrl: 'https://cdn.filestackcontent.com/cv-handle' }}
                    onClose={jest.fn()}
                    open
                />,
            )

            fireEvent.click(screen.getByRole('link', { name: 'Preview CV' }))

            expect(openSpy)
                .toHaveBeenCalledWith('', '_blank')
            expect(previewWindow.opener)
                .toBeNull()
            await waitFor(() => expect(previewWindow.location.href)
                .toBe('blob:cv-preview'))
            expect(global.fetch)
                .toHaveBeenCalledWith('https://cdn.filestackcontent.com/cv-handle')
        } finally {
            openSpy.mockRestore()
            global.fetch = originalFetch
            URL.createObjectURL = originalCreateObjectURL
        }
    })

    it('opens DOCX CVs in the Office Online viewer', async () => {
        const originalFetch = global.fetch
        const previewWindow = {
            document: { body: {}, title: '' },
            location: { href: '' },
            opener: {},
        }
        const openSpy = jest.spyOn(window, 'open')
            .mockReturnValue(previewWindow as unknown as Window)
        global.fetch = jest.fn()
            .mockRejectedValue(new Error('CORS')) as unknown as typeof fetch

        try {
            render(
                <ApplicationDetailModal
                    application={{ ...application, cvFileUrl: 'https://files.example.com/cv.docx' }}
                    onClose={jest.fn()}
                    open
                />,
            )

            fireEvent.click(screen.getByRole('link', { name: 'Preview CV' }))

            await waitFor(() => expect(previewWindow.location.href)
                .toBe('https://view.officeapps.live.com/op/view.aspx?src=https%3A%2F%2Ffiles.example.com%2Fcv.docx'))
        } finally {
            openSpy.mockRestore()
            global.fetch = originalFetch
        }
    })

    it('hides the cover letter section for applications without one', () => {
        render(
            <ApplicationDetailModal
                application={application}
                onClose={jest.fn()}
                open
            />,
        )

        expect(screen.queryByText('Cover Letter'))
            .toBeNull()
    })
})
