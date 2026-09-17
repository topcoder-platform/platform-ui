/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import {
    act,
    render,
    screen,
} from '@testing-library/react'
import { SWRConfig } from 'swr'

import { getChallengeReviewSummations } from '../services'

import { MarathonDashboard } from './MarathonDashboard'

jest.mock('../services', () => ({
    getChallengeReviewSummations: jest.fn(),
}))

jest.mock('highcharts', () => ({}))
jest.mock('highcharts-react-official', () => ({
    __esModule: true,
    default: (props: { options: unknown }): JSX.Element => (
        <div data-options={JSON.stringify(props.options)} data-testid='marathon-chart' />
    ),
}))
jest.mock('~/libs/ui', () => ({
    LoadingSpinner: (): JSX.Element => <span>Loading</span>,
}), { virtual: true })

const mockedGetReviewSummations = getChallengeReviewSummations as jest.Mock

describe('MarathonDashboard', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedGetReviewSummations.mockResolvedValue([{
            aggregateScore: 35.123456789,
            createdAt: '2026-06-03T10:00:00.000Z',
            id: 'summation',
            isPassing: true,
            isProvisional: true,
            submissionId: 'submission',
            submitterHandle: 'coder',
            submitterId: 123,
            submitterMaxRating: 2100,
        }])
    })

    it('renders the Figma Challenge Activity chart from Review API summations', async () => {
        render(
            <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
                <MarathonDashboard
                    challenge={{ id: 'challenge', name: 'MM', type: 'Marathon Match' }}
                />
            </SWRConfig>,
        )

        expect(await screen.findByRole('heading', { name: 'Challenge Activity' }))
            .toBeInTheDocument()
        const chart = screen.getByTestId('marathon-chart')
        expect(chart)
            .toHaveAttribute('data-options', expect.stringContaining('"scoreLabel":"35.123456789"'))
        expect(chart)
            .toHaveAttribute('data-options', expect.stringContaining('Score: <b>{point.custom.scoreLabel}</b>'))
        expect(chart)
            .toHaveAttribute('data-options', expect.stringContaining('coder'))
        expect(mockedGetReviewSummations)
            .toHaveBeenCalledWith('challenge')
        expect(screen.getByRole('table', { name: 'Marathon Match submission scores over time' }))
            .toBeInTheDocument()
        expect(screen.getByRole('cell', { name: '35.123456789' }))
            .toBeInTheDocument()
    })

    it('graphs every point on Marathon Matches larger than the Highcharts turbo threshold', async () => {
        // Highcharts drops keyed point configs above its default 1000-point
        // turbo threshold, which left large Marathon Matches with an empty
        // chart. Production challenges reach ~1100 graphed submissions.
        const summations = Array.from({ length: 1200 }, (_value, index) => ({
            aggregateScore: 40 + (index % 50),
            createdAt: new Date(Date.UTC(2026, 0, 13) + index * 60000)
                .toISOString(),
            id: `summation-${index}`,
            isPassing: true,
            isProvisional: true,
            submissionId: `submission-${index}`,
            submitterHandle: `coder${index % 60}`,
            submitterId: index % 60,
            submitterMaxRating: 1500,
        }))
        mockedGetReviewSummations.mockResolvedValue(summations)

        render(
            <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
                <MarathonDashboard
                    challenge={{ id: 'large-mm', name: 'MM', type: 'Marathon Match' }}
                />
            </SWRConfig>,
        )

        expect(await screen.findByRole('heading', { name: 'Challenge Activity' }))
            .toBeInTheDocument()
        const options = JSON.parse(
            screen.getByTestId('marathon-chart')
                .getAttribute('data-options') as string,
        )
        expect(options.series[0].turboThreshold)
            .toBe(0)
        expect(options.series[0].data)
            .toHaveLength(1200)

        // Prove the configuration renders: without turboThreshold Highcharts
        // discards the series and silently draws an empty plot area.
        const highcharts = jest.requireActual('highcharts')
        const container = document.createElement('div')
        document.body.appendChild(container)
        const chart = highcharts.chart(container, {
            chart: { animation: false, type: 'scatter' },
            series: options.series,
        })
        expect(chart.series[0].yData)
            .toHaveLength(1200)
    })

    it('shows one stable error state without automatically retrying a missing score feed', async () => {
        mockedGetReviewSummations.mockRejectedValueOnce(new Error('Unauthorized'))

        render(
            <SWRConfig
                value={{
                    dedupingInterval: 0,
                    errorRetryInterval: 1,
                    provider: () => new Map(),
                }}
            >
                <MarathonDashboard
                    challenge={{ id: 'no-scores', name: 'MM', type: 'Marathon Match' }}
                />
            </SWRConfig>,
        )

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Dashboard unavailable')
        await act(async () => {
            await new Promise(resolve => {
                setTimeout(resolve, 20)
            })
        })
        expect(mockedGetReviewSummations)
            .toHaveBeenCalledTimes(1)
    })
})
