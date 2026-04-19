/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, sort-keys */
import '@testing-library/jest-dom'

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'react-toastify'

import {
    updateMemberEmailPreferencesAsync,
    useMemberEmailPreferences,
} from '~/libs/core'

import PreferencesTab from './PreferencesTab'

const mockUpdateMemberEmailPreferencesAsync = updateMemberEmailPreferencesAsync as jest.MockedFunction<
    typeof updateMemberEmailPreferencesAsync
>
const mockUseMemberEmailPreferences = useMemberEmailPreferences as jest.MockedFunction<
    typeof useMemberEmailPreferences
>

jest.mock('react-toastify', () => ({
    toast: {
        error: jest.fn(),
        success: jest.fn(),
    },
}))

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        ENV: 'dev',
        TC_DOMAIN: 'topcoder-dev.com',
    },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    updateMemberEmailPreferencesAsync: jest.fn(),
    useMemberEmailPreferences: jest.fn(),
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    Button: (props: {
        label: string
        onClick?: () => void
        type?: 'button' | 'submit'
    }) => (
        <button type={props.type === 'submit' ? 'submit' : 'button'} onClick={props.onClick}>
            {props.label}
        </button>
    ),
    FormToggleSwitch: (props: {
        name: string
        onChange: () => void
        value: boolean
    }) => (
        <input
            aria-label={props.name}
            checked={props.value}
            name={props.name}
            onChange={props.onChange}
            type='checkbox'
        />
    ),
    LoadingSpinner: () => <div>loading-spinner</div>,
}), { virtual: true })

jest.mock('../../../lib', () => ({
    EmailIcon: () => <span>email-icon</span>,
    ForumIcon: () => <span>forum-icon</span>,
    SettingSection: (props: {
        actionElement?: React.ReactNode
        infoText?: string
        leftElement?: React.ReactNode
        title: string
    }) => (
        <section>
            {props.leftElement}
            <h2>{props.title}</h2>
            {props.infoText && <p>{props.infoText}</p>}
            {props.actionElement}
        </section>
    ),
}))

describe('PreferencesTab', () => {
    const mutate = jest.fn()
    const profile = {
        email: 'member@example.com',
    } as any

    beforeEach(() => {
        jest.clearAllMocks()
        mutate.mockReset()
    })

    it('shows a loading state while email preferences are being fetched', () => {
        mockUseMemberEmailPreferences.mockReturnValue({
            data: undefined,
            mutate,
        })

        render(<PreferencesTab profile={profile} />)

        expect(screen.getByText('loading-spinner'))
            .toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Go To Forum' }))
            .toBeInTheDocument()
    })

    it('updates the weekly work opportunities preference', async () => {
        const user = userEvent.setup()

        mockUseMemberEmailPreferences.mockReturnValue({
            data: {
                email_address: profile.email,
                interests: {
                    d0c48e9da3: false,
                },
                status: 'subscribed',
            },
            mutate,
        })
        mockUpdateMemberEmailPreferencesAsync.mockResolvedValue({
            email_address: profile.email,
            interests: {
                d0c48e9da3: true,
            },
            status: 'subscribed',
        })

        render(<PreferencesTab profile={profile} />)

        expect(screen.getByText('Work Opportunities'))
            .toBeInTheDocument()

        await user.click(screen.getByLabelText('d0c48e9da3'))

        await waitFor(() => {
            expect(mockUpdateMemberEmailPreferencesAsync)
                .toHaveBeenCalledWith(profile.email, {
                    interests: {
                        d0c48e9da3: true,
                    },
                })
        })

        expect(toast.success)
            .toHaveBeenCalledWith('Your email preferences were updated.')
        expect(mutate)
            .toHaveBeenCalled()
    })

    it('opens forum preferences in a new tab', async () => {
        const user = userEvent.setup()
        const openSpy = jest.spyOn(window, 'open')
            .mockImplementation(() => window)

        mockUseMemberEmailPreferences.mockReturnValue({
            data: {
                email_address: profile.email,
                interests: {},
                status: 'unsubscribed',
            },
            mutate,
        })

        render(<PreferencesTab profile={profile} />)

        await user.click(screen.getByRole('button', { name: 'Go To Forum' }))

        expect(openSpy)
            .toHaveBeenCalledWith(
                'https://vanilla.topcoder-dev.com/profile/preferences',
                '_blank',
            )

        openSpy.mockRestore()
    })
})
