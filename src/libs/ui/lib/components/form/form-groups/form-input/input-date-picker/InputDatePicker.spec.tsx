/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

import InputDatePicker from './InputDatePicker'

jest.mock('../../../../svgs', () => ({
    IconOutline: {
        ArrowCircleLeftIcon: (): JSX.Element => <span>Previous</span>,
        ArrowCircleRightIcon: (): JSX.Element => <span>Next</span>,
    },
}))

describe('InputDatePicker future years', () => {
    it('allows a future Wipro end date and extends the year list when navigating forward', () => {
        const onChange = jest.fn()
        const year = new Date()
            .getFullYear() + 10
        render(
            <InputDatePicker
                date={new Date(year, 11, 15)}
                disabled={false}
                label='Wipro ID End Date'
                onChange={onChange}
            />,
        )
        fireEvent.click(screen.getByPlaceholderText('Select a date'))
        expect(screen.getByRole('option', { name: String(year) }))
            .toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Next' }))
        expect(screen.getByRole('option', { name: String(year + 1) }))
            .toHaveProperty('selected', true)
        fireEvent.click(screen.getByRole('option', { name: new RegExp(`January 15th, ${year + 1}`) }))
        expect(onChange)
            .toHaveBeenCalledWith(new Date(year + 1, 0, 15))
    })

    it('preserves explicit maximum years for date-limited inputs', async () => {
        const maxDate = new Date(2026, 8, 30)
        render(<InputDatePicker date={maxDate} disabled={false} label='Date' maxDate={maxDate} onChange={jest.fn()} />)
        fireEvent.click(screen.getByPlaceholderText('Select a date'))
        expect(screen.queryByRole('option', { name: '2027' }))
            .not.toBeInTheDocument()
        expect(await screen.findByRole('option', { name: '2026' }))
            .toBeInTheDocument()
    })
})
