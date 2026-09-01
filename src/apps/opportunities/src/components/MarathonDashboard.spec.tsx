/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import {
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
            aggregateScore: 35.12,
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
            .toHaveAttribute('data-options', expect.stringContaining('35.12'))
        expect(chart)
            .toHaveAttribute('data-options', expect.stringContaining('coder'))
        expect(mockedGetReviewSummations)
            .toHaveBeenCalledWith('challenge')
        expect(screen.getByRole('table', { name: 'Marathon Match submission scores over time' }))
            .toBeInTheDocument()
    })
})
