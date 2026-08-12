/* eslint-disable import/no-extraneous-dependencies, no-script-url, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { render, RenderResult } from '@testing-library/react'
import Highcharts from 'highcharts/highmaps'

import WorldMap from './WorldMap'

jest.mock(
    '~/config',
    () => ({
        EnvironmentConfig: {
            API: { V6: 'https://api.example.com' },
            REPORTS_API: 'https://reports.example.com',
        },
    }),
    { virtual: true },
)
jest.mock(
    '~/libs/core',
    () => ({
        xhrGetAsync: jest.fn(),
    }),
    { virtual: true },
)

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
    it('enables desktop and touch map navigation with a mobile legend layout', () => {
        const { getByRole }: RenderResult = render(
            <WorldMap
                countries={[]}
                showWinnerDetails={false}
                valueLabel='Members'
            />,
        )

        expect(mockOptions.mapNavigation)
            .toMatchObject({
                enableButtons: false,
                enabled: true,
                enableDoubleClickZoom: true,
                enableMouseWheelZoom: true,
                enableTouchZoom: true,
            })
        expect(mockOptions.responsive?.rules?.[0])
            .toMatchObject({
                chartOptions: {
                    chart: { margin: [0, 0, 80, 0] },
                    legend: {
                        itemDistance: 24,
                        symbolHeight: 12,
                        symbolWidth: 12,
                        width: 340,
                    },
                },
                condition: { maxWidth: 480 },
            })
        expect(
            getByRole('button', { name: 'Toggle fullscreen map' }),
        )
            .toBeInTheDocument()
    })

    it('scales color-axis buckets from the largest value', () => {
        render(
            <WorldMap
                countries={[
                    {
                        code: 'IN',
                        count: 730554,
                        name: 'India',
                    },
                ]}
                showWinnerDetails={false}
                valueLabel='Members'
            />,
        )

        const colorAxis = Array.isArray(mockOptions.colorAxis)
            ? mockOptions.colorAxis[0]
            : mockOptions.colorAxis
        const dataClasses = colorAxis?.dataClasses

        expect(dataClasses?.map(dataClass => dataClass.name))
            .toEqual([
                '1 - 200,000',
                '200,001 - 400,000',
                '400,001 - 600,000',
                '600,001+',
            ])
    })

    it('renders Figma winner details with formatted and escaped values', () => {
        render(
            <WorldMap
                countries={[
                    {
                        code: 'IN',
                        count: 204024,
                        name: 'India<script>',
                        topWinners: [
                            {
                                handle: 'blue<winner>',
                                maxRating: 1400,
                                photoURL: 'javascript:alert(1)',
                                wins: 1768,
                            },
                        ],
                    },
                ]}
                showWinnerDetails
                valueLabel='First-place wins'
            />,
        )

        const html = formatTooltip({
            code: 'IN',
            name: 'India<script>',
            topWinners: [
                {
                    handle: 'blue<winner>',
                    maxRating: 1400,
                    photoURL: 'javascript:alert(1)',
                    wins: 1768,
                },
            ],
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
        expect(html).not.toContain('<script>')
        expect(html).not.toContain('javascript:')
    })

    it('renders country member, skill, and top-member details', () => {
        render(
            <WorldMap
                countries={[
                    {
                        code: 'IN',
                        count: 730554,
                        name: 'India',
                        skillsBreakdown: [
                            { count: 40, name: 'JavaScript', percentage: 40 },
                            { count: 30, name: 'Python', percentage: 30 },
                            { count: 15, name: 'Swift', percentage: 15 },
                        ],
                        topMembers: [
                            {
                                handle: 'top-member',
                                maxRating: 1400,
                                wins: 1768,
                            },
                            {
                                handle: 'second-member',
                                maxRating: 1300,
                                wins: 1500,
                            },
                            {
                                handle: 'third-member',
                                maxRating: 1200,
                                wins: 1200,
                            },
                        ],
                        totalSkills: 1059,
                    },
                ]}
                showWinnerDetails={false}
                valueLabel='Members'
            />,
        )

        const html = formatTooltip({
            code: 'IN',
            name: 'India',
            skillsBreakdown: [
                { count: 40, name: 'JavaScript', percentage: 40 },
                { count: 30, name: 'Python', percentage: 30 },
                { count: 15, name: 'Swift', percentage: 15 },
            ],
            topMembers: [
                {
                    handle: 'top-member',
                    maxRating: 1400,
                    wins: 1768,
                },
                {
                    handle: 'second-member',
                    maxRating: 1300,
                    wins: 1500,
                },
                {
                    handle: 'third-member',
                    maxRating: 1200,
                    wins: 1200,
                },
            ],
            topWinners: [],
            totalSkills: 1059,
            value: 730554,
        })

        expect(html)
            .toContain('Total Members')
        expect(html)
            .toContain('730,554')
        expect(html)
            .toContain('Total Skills')
        expect(html)
            .toContain('1,059')
        expect(html)
            .toContain('Sub-Skill Breakdown')
        expect(html)
            .toContain('JavaScript')
        expect(html)
            .toContain('Others')
        expect(html)
            .toContain('40%')
        expect(html)
            .toContain('Top Members')
        expect(html)
            .toContain('top-member')
        expect(html)
            .toContain('Wins: <strong>1,768</strong>')
        expect(html)
            .toContain('third-member')
        expect(html)
            .toContain('fi-in')
    })
})
