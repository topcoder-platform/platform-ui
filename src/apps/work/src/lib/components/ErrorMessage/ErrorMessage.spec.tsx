/* eslint-disable import/no-extraneous-dependencies */
import {
    render,
    screen,
} from '@testing-library/react'

import { ErrorMessage } from './ErrorMessage'

jest.mock('~/libs/ui', () => ({
    Button: (props: { label: string }) => (
        <button type='button'>{props.label}</button>
    ),
}), {
    virtual: true,
})

describe('ErrorMessage', () => {
    it('renders the Topcoder support email as a mailto link', () => {
        const message = 'You don’t have access to this project. Please contact support@topcoder.com.'

        render(<ErrorMessage message={message} />)

        const supportLink = screen.getByRole('link', { name: 'support@topcoder.com' })

        expect(supportLink.getAttribute('href'))
            .toBe('mailto:support@topcoder.com')
        expect(supportLink.closest('p')?.textContent)
            .toBe(message)
    })
})
