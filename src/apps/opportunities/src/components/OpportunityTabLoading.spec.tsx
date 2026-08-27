/* eslint-disable import/no-extraneous-dependencies */
import { render, screen } from '@testing-library/react'

import { OpportunityTabLoading } from './OpportunityTabLoading'

jest.mock('~/libs/ui', () => ({
    LoadingSpinner: (props: { inline?: boolean }): JSX.Element => (
        <span data-inline={String(!!props.inline)}>Spinner</span>
    ),
}), { virtual: true })

describe('OpportunityTabLoading', () => {
    it('renders an inline status scoped to the active detail tab', () => {
        render(<OpportunityTabLoading label='Loading registrants' />)

        const status = screen.getByRole('status', { name: 'Loading registrants' })
        const spinner = screen.getByText('Spinner')
        expect(status.contains(spinner))
            .toBe(true)
        expect(spinner.getAttribute('data-inline'))
            .toBe('true')
    })
})
