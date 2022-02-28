import '@testing-library/jest-dom'
import { render, RenderResult } from '@testing-library/react'

import { UserProfile } from '../interfaces'

import Avatar from './Avatar'

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

describe('<Avatar /> and there is NOT a profile', () => {

    test('it should NOT display the Avatar', () => {
        const renderResult: RenderResult = render(<Avatar profile={undefined} />)
        renderResult.debug()
        const AvatarElement: HTMLElement | null = renderResult.container.querySelector('.avatar')
        expect(AvatarElement).toBeNull()
    })
})

describe('<Avatar /> and there is a profile', () => {

    test('if there is NO photoURL, firstname, or lastname, it should NOT display the Avatar', () => {
        const newMockProfile: UserProfile = {
            ...mockProfile,
            firstName: '',
            lastName: '',
            photoURL: undefined,
        }
        const renderResult: RenderResult = render(<Avatar profile={newMockProfile} />)
        renderResult.debug()
        const AvatarElement: HTMLElement | null = renderResult.container.querySelector('.avatar')
        expect(AvatarElement).toBeNull()
    })

    test('if there is a photoURL, it should display the Avatar', () => {
        const renderResult: RenderResult = render(<Avatar profile={mockProfile} />)
        const AvatarElement: HTMLElement | null = renderResult.container.querySelector('.avatar')
        expect(AvatarElement).toBeInTheDocument()
    })

    test('if there is a photoURL, it should NOT display the Avatar letters', () => {
        const renderResult: RenderResult = render(<Avatar profile={mockProfile} />)
        renderResult.debug()
        const AvatarElement: HTMLElement | null = renderResult.container.querySelector('.avatar-letters')
        expect(AvatarElement).toBeNull()
    })

    test('if there is NOT a photoURL, it should display the Avatar Letters', () => {
        const newMockProfile: UserProfile = {
            ...mockProfile,
            photoURL: undefined,
        }
        const renderResult: RenderResult = render(<Avatar profile={newMockProfile} />)
        renderResult.debug()
        const AvatarElement: HTMLElement | null = renderResult.container.querySelector('.avatar-letters')
        expect(AvatarElement).toBeInTheDocument()
    })

    test('if there is NOT an avatar URL, it should NOT display the Avatar', () => {
        const newMockProfile: UserProfile = {
            ...mockProfile,
            photoURL: undefined,
        }
        const renderResult: RenderResult = render(<Avatar profile={newMockProfile} />)
        renderResult.debug()
        const AvatarElement: HTMLElement | null = renderResult.container.querySelector('.avatar-letters')
        expect(AvatarElement).toBeInTheDocument()
    })
})
