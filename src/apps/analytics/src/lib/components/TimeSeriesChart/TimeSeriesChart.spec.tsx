/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, unicorn/no-null */
import '@testing-library/jest-dom'
import { render, screen, within } from '@testing-library/react'
import HighchartsReact from 'highcharts-react-official'

import { TimeSeriesChart } from './TimeSeriesChart'

jest.mock('highcharts-react-official', () => jest.fn(() => null))

const series = [{ color: '#137d60', key: 'visitors', label: 'Visitors' }]
const points = [14, 0, 0, 0, 0, 0, 0, 1].map((visitors, index) => ({
    date: new Date(Date.UTC(2026, 10, 5 + index))
        .toISOString()
        .slice(0, 10),
    visitors,
}))

describe('TimeSeriesChart', () => {
    it('overlays daily columns with a linked seven-day trend and exposes both values in the table', () => {
        render(<TimeSeriesChart ariaLabel='Daily visitors' points={points} series={series} variant='column-trend' />)
        const [columns, trend] = (HighchartsReact as unknown as jest.Mock).mock.calls[0][0].options.series
        expect(columns)
            .toMatchObject({ data: [14, 0, 0, 0, 0, 0, 0, 1], type: 'column' })
        expect(trend)
            .toMatchObject({ data: [14, 7, 4.67, 3.5, 2.8, 2.33, 2, 0.14], linkedTo: columns.id, type: 'line' })
        const table = within(screen.getByRole('table', { name: 'Daily visitors' }))
        expect(table.getByRole('columnheader', { name: 'Visitors (7-day average)' }))
            .toBeInTheDocument()
        expect(table.getAllByRole('row')[8])
            .toHaveTextContent('0.14')
    })

    it('keeps the existing empty state when all daily values are zero', () => {
        render(<TimeSeriesChart
            ariaLabel='Daily visitors'
            points={[points[1]]}
            series={series}
            variant='column-trend'
        />)
        expect(screen.getByRole('status'))
            .toHaveTextContent('No activity is available')
    })
})
