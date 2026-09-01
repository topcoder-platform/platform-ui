/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

import { OpportunitySortSelect } from './OpportunitySortSelect'

const options = [
    { label: 'Newest first', value: 'newest' },
    { label: 'Starting soon', value: 'startingSoon' },
]

describe('OpportunitySortSelect', () => {
    it('renders authored options and selects one by pointer', () => {
        const onChange = jest.fn()
        render(<OpportunitySortSelect onChange={onChange} options={options} value='newest' />)

        fireEvent.click(screen.getByRole('combobox', { name: 'Sort opportunities' }))

        expect(screen.getAllByRole('option'))
            .toHaveLength(2)
        fireEvent.click(screen.getByRole('option', { name: 'Starting soon' }))
        expect(onChange)
            .toHaveBeenCalledWith('startingSoon')
        expect(screen.queryByRole('listbox'))
            .not.toBeInTheDocument()
    })

    it('supports arrow, Enter, and Escape keyboard interaction', () => {
        const onChange = jest.fn()
        render(<OpportunitySortSelect onChange={onChange} options={options} value='newest' />)
        const control = screen.getByRole('combobox', { name: 'Sort opportunities' })

        fireEvent.keyDown(control, { key: 'ArrowDown' })
        fireEvent.keyDown(control, { key: 'Enter' })
        expect(onChange)
            .toHaveBeenCalledWith('startingSoon')

        fireEvent.click(control)
        fireEvent.keyDown(control, { key: 'Escape' })
        expect(screen.queryByRole('listbox'))
            .not.toBeInTheDocument()
    })
})
