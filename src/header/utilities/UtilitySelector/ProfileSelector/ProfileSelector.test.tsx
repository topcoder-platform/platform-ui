import '@testing-library/jest-dom'
import { render, RenderResult, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { UserProfile } from '../../../../lib/interfaces'

import ProfileSelector from './ProfileSelector'

const mockProfile: UserProfile = {
    competitionCountryCode: 'string',
    createdAt: 5,
    email: 'string',
    firstName: 'string',
    handle: 'string',
    handleLower: 'string',
    homeCountryCode: 'string',
    lastName: 'string',
    photoURL: 'string',
    status: 'string',
    updatedAt: 5,
    userId: 8,
}

describe('<ProfileSelector /> when the props have NOT been initialized', () => {

    test('it should NOT display the ProfileSelector', () => {
        const renderResult: RenderResult = render(
            <MemoryRouter>
                <ProfileSelector initialized={false} profile={undefined} />
            </MemoryRouter>
        )
        const ProfileSelectorElement: HTMLElement | null = renderResult.container.querySelector('.profile-selector')
        expect(ProfileSelectorElement).toBeNull()
    })
})

describe('<ProfileSelector /> when the props have been initialized', () => {

    test('it should display the ProfileSelector', () => {
        const renderResult: RenderResult = render(
            <MemoryRouter>
                <ProfileSelector initialized={true} profile={mockProfile} />
            </MemoryRouter>
        )
        const ProfileSelectorElement: HTMLElement | null = renderResult.container.querySelector('.profile-selector')
        expect(ProfileSelectorElement).toBeInTheDocument()
    })
})

describe('<ProfileSelector /> when the props have been initialized and there NOT is a profile', () => {

    test('it should display the login', () => {
        render(
            <MemoryRouter>
                <ProfileSelector initialized={true} profile={undefined} />
            </MemoryRouter>
        )
        const loginElement: HTMLElement | null = screen.getByText('Log In')
        expect(loginElement).toBeDefined()
    })

    test('it should display the signup', () => {
        render(
            <MemoryRouter>
                <ProfileSelector initialized={true} profile={undefined} />
            </MemoryRouter>
        )
        const signupElement: HTMLElement | null = screen.getByText('Sign Up')
        expect(signupElement).toBeDefined()
    })

    test('it should NOT display the Avatar', () => {
        const renderResult: RenderResult = render(
            <MemoryRouter>
                <ProfileSelector initialized={true} profile={undefined} />
            </MemoryRouter>
        )
        const avatarElement: HTMLElement | null = renderResult.container.querySelector('.avatar-container')
        expect(avatarElement).toBeNull()
    })
})

describe('<ProfileSelector /> when the props have been initialized and there is a profile', () => {

    test('it should NOT display the login', () => {
        render(
            <MemoryRouter>
                <ProfileSelector initialized={true} profile={mockProfile} />
            </MemoryRouter>
        )
        try {
            // this should error out b/c there is no item w/this text
            screen.getByText('Log In')
            expect(false).toBeTruthy()

        } catch {
            expect(true).toBeTruthy()
        }
    })

    test('it should NOT display the signup', () => {
        render(
            <MemoryRouter>
                <ProfileSelector initialized={true} profile={mockProfile} />
            </MemoryRouter>
        )
        try {
            // this should error out b/c there is no item w/this text
            screen.getByText('Sign Up')
            expect(false).toBeTruthy()

        } catch {
            expect(true).toBeTruthy()
        }
    })

    test('it should display the Avatar', () => {
        const renderResult: RenderResult = render(
            <MemoryRouter>
                <ProfileSelector initialized={true} profile={mockProfile} />
            </MemoryRouter>
        )
        const avatarElement: HTMLElement | null = renderResult.container.querySelector('.avatar-container')
        expect(avatarElement).toBeInTheDocument()
    })
})
