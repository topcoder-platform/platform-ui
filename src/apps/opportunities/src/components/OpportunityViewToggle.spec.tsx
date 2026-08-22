/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

import { OpportunityViewToggle } from './OpportunityViewToggle'

describe('OpportunityViewToggle', () => {
    it('announces list as the active default and selects grid', () => {
        const onChange = jest.fn()
        render(<OpportunityViewToggle onChange={onChange} value='list' />)

        expect(screen.getByRole('button', { name: 'List view' }))
            .toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByRole('button', { name: 'Grid view' }))
            .toHaveAttribute('aria-pressed', 'false')

        fireEvent.click(screen.getByRole('button', { name: 'Grid view' }))
        expect(onChange)
            .toHaveBeenCalledWith('grid')
    })

    it('keeps the active grid button available for keyboard and pointer selection', () => {
        const onChange = jest.fn()
        render(<OpportunityViewToggle onChange={onChange} value='grid' />)

        const grid = screen.getByRole('button', { name: 'Grid view' })
        expect(grid)
            .toHaveAttribute('aria-pressed', 'true')
        expect(grid)
            .not.toBeDisabled()

        fireEvent.click(screen.getByRole('button', { name: 'List view' }))
        expect(onChange)
            .toHaveBeenCalledWith('list')
    })
})
