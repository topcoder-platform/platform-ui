/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import ExpandableText from './ExpandableText'

jest.mock('~/libs/ui', () => ({
    Button: (props: { label: string, onClick?: () => void }) => (
        <button onClick={props.onClick} type='button'>{props.label}</button>
    ),
}), { virtual: true })

/**
 * jsdom does no layout, so scrollHeight and clientHeight are both 0. Stub them to stand in for text
 * that does, or does not, overflow the three-line clamp.
 */
const stubHeights = (scrollHeight: number, clientHeight: number): void => {
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
        configurable: true,
        get: () => scrollHeight,
    })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
        configurable: true,
        get: () => clientHeight,
    })
}

describe('ExpandableText', () => {
    afterEach(() => {
        stubHeights(0, 0)
    })

    it('shows no toggle when the text fits in three lines', () => {
        stubHeights(60, 60)
        render(<ExpandableText text='Sprint planning' />)

        expect(screen.getByText('Sprint planning'))
            .toBeInTheDocument()
        expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('toggles between the clamped and the full text when it overflows', async () => {
        const user = userEvent.setup()
        stubHeights(200, 60)
        render(<ExpandableText text='A long remark' />)

        await user.click(screen.getByRole('button', { name: 'Show more' }))

        expect(screen.getByRole('button', { name: 'Show less' }))
            .toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Show less' }))

        expect(screen.getByRole('button', { name: 'Show more' }))
            .toBeInTheDocument()
    })
})
