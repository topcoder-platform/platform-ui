/* eslint-disable import/no-extraneous-dependencies, no-script-url, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import Highcharts from 'highcharts/highmaps'

import WorldMap from './WorldMap'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        API: { V6: 'https://api.example.com' },
        REPORTS_API: 'https://reports.example.com',
    },
}), { virtual: true })
jest.mock('~/libs/core', () => ({
    xhrGetAsync: jest.fn(),
}), { virtual: true })

let mockOptions: Highcharts.Options

jest.mock('highcharts-react-official', () => ({
    __esModule: true,
    default: (props: { options: Highcharts.Options }): JSX.Element => {
        mockOptions = props.options
        return <div data-testid='world-map' />
    },
}))

function formatTooltip(point: Record<string, unknown>): string {
    const formatter = mockOptions.tooltip?.formatter
    if (!formatter) {
        throw new Error('Tooltip formatter is missing')
    }

    const result = formatter.call(
        { point } as unknown as Highcharts.TooltipFormatterContextObject,
        {} as Highcharts.Tooltip,
    )
    if (typeof result !== 'string') {
        throw new Error('Tooltip formatter did not return HTML')
    }

    return result
}

describe('WorldMap tooltip', () => {
    it('renders Figma winner details with formatted and escaped values', () => {
        render(
            <WorldMap
                countries={[{
                    code: 'IN',
                    count: 204024,
                    name: 'India<script>',
                    topWinners: [{
                        handle: 'blue<winner>',
                        maxRating: 1400,
                        photoURL: 'javascript:alert(1)',
                        wins: 1768,
                    }],
                }]}
                showWinnerDetails
                valueLabel='First-place wins'
            />,
        )

        const html = formatTooltip({
            code: 'IN',
            name: 'India<script>',
            topWinners: [{
                handle: 'blue<winner>',
                maxRating: 1400,
                photoURL: 'javascript:alert(1)',
                wins: 1768,
            }],
            value: 204024,
        })

        expect(html)
            .toContain('Winners: 204,024')
        expect(html)
            .toContain('blue&lt;winner&gt;')
        expect(html)
            .toContain('Wins: <strong>1,768</strong>')
        expect(html)
            .toContain('#616BD5')
        expect(html)
            .toContain('fi-in')
        expect(html)
            .not.toContain('<script>')
        expect(html)
            .not.toContain('javascript:')
    })

    it('keeps the compact member tooltip on Countries Represented', () => {
        render(
            <WorldMap
                countries={[{
                    code: 'US',
                    count: 1234,
                    name: 'United States',
                }]}
                showWinnerDetails={false}
                valueLabel='Members'
            />,
        )

        const html = formatTooltip({
            code: 'US',
            name: 'United States',
            topWinners: [],
            value: 1234,
        })

        expect(html)
            .toContain('United States')
        expect(html)
            .toContain('1,234')
        expect(html)
            .toContain('members')
        expect(html)
            .not.toContain('Top Winners')
    })
})
