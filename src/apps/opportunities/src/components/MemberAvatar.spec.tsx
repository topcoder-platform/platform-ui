/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { fireEvent, render, RenderResult } from '@testing-library/react'

import { getMemberAvatarPalette } from '../utils/member-avatar.utils'

import { MemberAvatar } from './MemberAvatar'

describe('MemberAvatar', () => {
    it('shows the member photo without placeholder styling', () => {
        const { container }: RenderResult = render(
            <MemberAvatar className='host' handle='vasea' photoURL='https://images.example/vasea.png' />,
        )
        const avatar = container.firstElementChild as HTMLElement

        expect(avatar.querySelector('img'))
            .toHaveAttribute('src', 'https://images.example/vasea.png')
        expect(avatar)
            .toHaveAttribute('aria-hidden', 'true')
        expect(avatar)
            .toHaveClass('avatar', 'host')
        expect(avatar)
            .not.toHaveClass('placeholder')
    })

    it('renders the colored handle initial when the member has no photo', () => {
        const { container }: RenderResult = render(<MemberAvatar className='host' handle='vasea' />)
        const avatar = container.firstElementChild as HTMLElement

        expect(avatar)
            .toHaveTextContent(/^V$/)
        expect(avatar)
            .toHaveClass('avatar', 'placeholder', getMemberAvatarPalette('vasea'), 'host')
        expect(avatar.querySelector('img'))
            .toBeNull()
    })

    it('switches to the placeholder when the photo fails to load', () => {
        const { container }: RenderResult = render(
            <MemberAvatar handle='tourist' photoURL='https://images.example/broken.png' />,
        )
        const avatar = container.firstElementChild as HTMLElement

        fireEvent.error(avatar.querySelector('img') as HTMLImageElement)

        expect(avatar)
            .toHaveTextContent(/^T$/)
        expect(avatar)
            .toHaveClass('placeholder', getMemberAvatarPalette('tourist'))
    })

    it('renders an empty neutral placeholder when the handle is unknown', () => {
        const { container }: RenderResult = render(<MemberAvatar />)
        const avatar = container.firstElementChild as HTMLElement

        expect(avatar)
            .toBeEmptyDOMElement()
        expect(avatar)
            .toHaveClass('placeholder', 'gray')
    })
})
