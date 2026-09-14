/* eslint-disable sort-keys, react/jsx-no-bind, import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { UserProfile } from '~/libs/core'

import { applyToGig } from '../gigs.service'
import { Gig } from '../models'

import GigApplicationForm from './GigApplicationForm'

jest.mock('react-router-dom', () => {
    const util = jest.requireActual('util')
    global.TextEncoder = util.TextEncoder
    return jest.requireActual('react-router-dom')
})
jest.mock(
    '~/config',
    () => ({
        EnvironmentConfig: {
            TC_DOMAIN: 'topcoder-dev.com',
            USER_PROFILE_URL: 'https://profiles.topcoder-dev.com',
            URLS: { ACCOUNT_SETTINGS: '/settings' },
        },
    }),
    { virtual: true },
)
jest.mock('~/libs/core', () => ({}), { virtual: true })
jest.mock('~/libs/shared', () => ({ autoCompleteSkills: jest.fn()
    .mockResolvedValue([]) }), {
    virtual: true,
})
jest.mock(
    '~/libs/ui',
    () => ({
        Button: (props: any) => (
            <button
                type={props.type === 'submit' ? 'submit' : 'button'}
                disabled={props.disabled}
                onClick={props.onClick}
            >
                {props.children}
            </button>
        ),
        BaseModal: (props: any) => (props.open ? (
            <div className={props.classNames?.modal} role='dialog'>
                <header>{props.title}</header>
                <div className={props.bodyClassName}>{props.children}</div>
                {props.buttons}
            </div>
        ) : undefined),
        LoadingSpinner: () => <span>Loading</span>,
    }),
    { virtual: true },
)
jest.mock('../gigs.service', () => ({ applyToGig: jest.fn(), getGigPolicy: jest.fn() }))

const profile = {
    userId: 123,
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    handle: 'jane',
    homeCountryCode: 'AUS',
    addresses: [{ city: 'Hobart' }],
} as UserProfile
const job: Gig = {
    name: 'Java engineer',
    slug: 'example-gig',
    job_status: { id: 1 },
    enable_job_application_form: 1,
    custom_fields: [],
}
const candidate = {
    contact_number: '+61 400 000 000',
    locality: 'Australia',
    salary_expectation: 500,
    skill: 'Java',
    resume: { filename: 'cv.pdf', file_link: 'https://example.com/cv.pdf' },
}

beforeEach(() => {
    jest.clearAllMocks()
    window.scrollTo = jest.fn()
})

describe('Gig application form', () => {
    it('prefills a returning member and requires affirmative answers and consent before submission', async () => {
        (applyToGig as jest.Mock).mockResolvedValue(undefined)
        render(
            <MemoryRouter>
                <GigApplicationForm
                    job={job}
                    slug='example-gig'
                    profile={profile}
                    candidate={candidate}
                />
            </MemoryRouter>,
        )
        expect((screen.getByLabelText('First name *') as HTMLInputElement).value)
            .toBe('Jane')
        expect((screen.getByLabelText('Weekly pay expectation (USD) *') as HTMLInputElement).value)
            .toBe(
                '500',
            )
        fireEvent.click(screen.getByRole('button', { name: 'Apply to this job' }))
        expect(applyToGig).not.toHaveBeenCalled()
        expect(screen.getByText('Accept the Candidate Terms to apply.'))
            .toBeTruthy()
        const questions = screen
            .getAllByRole('group')
            .filter(group => group.classList.contains('gigs-confirmation'))
        questions.forEach(question => fireEvent.click(within(question)
            .getByLabelText('Yes')))
        fireEvent.click(screen.getByLabelText('I agree to the Candidate Terms *'))
        fireEvent.click(screen.getByRole('button', { name: 'Apply to this job' }))
        await screen.findByText('Application submitted')
        expect(applyToGig)
            .toHaveBeenCalledTimes(1)
        const body = (applyToGig as jest.Mock).mock.calls[0][1] as FormData
        expect(body.has('resume'))
            .toBe(false)
        expect(JSON.parse(body.get('form') as string).skill)
            .toBe('Java')
    })
    it('retains the form and entered information when submission fails and permits retry', async () => {
        (applyToGig as jest.Mock)
            .mockRejectedValueOnce(new Error('Please try again.'))
            .mockResolvedValueOnce(undefined)
        render(
            <MemoryRouter>
                <GigApplicationForm
                    job={job}
                    slug='example-gig'
                    profile={profile}
                    candidate={candidate}
                />
            </MemoryRouter>,
        )
        screen.getAllByLabelText('Yes')
            .forEach(control => fireEvent.click(control))
        fireEvent.click(screen.getByLabelText('I agree to the Candidate Terms *'))
        fireEvent.change(screen.getByLabelText('Weekly pay expectation (USD) *'), {
            target: { value: '650' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Apply to this job' }))
        await screen.findByRole('alert')
        expect(screen.queryByText('Application submitted'))
            .toBeNull()
        expect((screen.getByLabelText('Weekly pay expectation (USD) *') as HTMLInputElement).value)
            .toBe(
                '650',
            )
        await waitFor(() => expect(
            (screen.getByRole('button', { name: 'Apply to this job' }) as HTMLButtonElement)
                .disabled,
        )
            .toBe(false))
        fireEvent.click(screen.getByRole('button', { name: 'Apply to this job' }))
        await screen.findByText('Application submitted')
    })
    it('blocks already placed candidates without rendering an application submit button', () => {
        render(
            <MemoryRouter>
                <GigApplicationForm
                    job={job}
                    slug='example-gig'
                    profile={profile}
                    candidate={{ ...candidate, custom_fields: [{ field_id: 12, value: 'Placed' }] }}
                />
            </MemoryRouter>,
        )
        expect(screen.getByText('One gig limit'))
            .toBeTruthy()
        expect(screen.queryByRole('button', { name: 'Apply to this job' }))
            .toBeNull()
        expect(applyToGig).not.toHaveBeenCalled()
    })
    it.each([
        ['Read Candidate Terms', 'CANDIDATE TERMS'],
        ['View our Equal Employment Opportunity Policy', 'Equal Employment Opportunity Policy'],
    ])('opens %s in a compact modal with a visible close action', (trigger, title) => {
        render(
            <MemoryRouter>
                <GigApplicationForm
                    job={job}
                    slug='example-gig'
                    profile={profile}
                    candidate={candidate}
                />
            </MemoryRouter>,
        )

        fireEvent.click(screen.getByRole('button', { name: trigger }))
        const dialog = screen.getByRole('dialog')
        expect(dialog.classList.contains('gigs-policy-modal'))
            .toBe(true)
        expect(within(dialog)
            .getByText(title))
            .toBeTruthy()
        expect(dialog.querySelector('.gigs-policy'))
            .toBeTruthy()
        fireEvent.click(within(dialog)
            .getByRole('button', { name: 'Close' }))
        expect(screen.queryByRole('dialog'))
            .toBeNull()
    })
})
