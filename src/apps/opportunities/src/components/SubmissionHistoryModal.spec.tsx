/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import { PropsWithChildren, ReactNode } from 'react'
import { SWRConfig } from 'swr'

import { getChallengeSubmissionHistory } from '../services'

import { SubmissionHistoryModal } from './SubmissionHistoryModal'

jest.mock('../services', () => ({
    getChallengeSubmissionHistory: jest.fn(),
}))

jest.mock('~/libs/ui', () => {
    const Icon = (): JSX.Element => <svg />
    return {
        BaseModal: (props: PropsWithChildren<{
            ariaLabelledby?: string
            open: boolean
            title?: ReactNode
        }>): JSX.Element => (props.open ? (
            <div aria-labelledby={props.ariaLabelledby} role='dialog'>
                {props.title}
                {props.children}
            </div>
        ) : <></>),
        IconOutline: new Proxy({}, { get: () => Icon }),
        LoadingSpinner: (): JSX.Element => <span>Loading</span>,
    }
}, { virtual: true })

const mockedGetHistory = getChallengeSubmissionHistory as jest.Mock

describe('SubmissionHistoryModal', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedGetHistory.mockResolvedValue([
            {
                finalScore: 50,
                id: 'submission-two',
                memberId: '123',
                status: 'COMPLETED_WITHOUT_WIN',
                submittedDate: '2026-06-02T10:00:00.000Z',
                type: 'CONTEST_SUBMISSION',
            },
            {
                id: 'submission-one',
                initialScore: 20,
                memberId: '123',
                status: 'ACTIVE',
                submittedDate: '2026-06-01T10:00:00.000Z',
                type: 'CONTEST_SUBMISSION',
            },
        ])
    })

    it('shows every attempt and Marathon Match score in a modal without a review redirect', async () => {
        const onClose = jest.fn()
        render(
            <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
                <SubmissionHistoryModal
                    challengeId='challenge'
                    isMarathonMatch
                    onClose={onClose}
                    open
                    reviewSummations={[{
                        aggregateScore: 31.25,
                        id: 'summation',
                        isProvisional: true,
                        submissionId: 'submission-two',
                    }]}
                    showFinalScores
                    submission={{
                        id: 'submission-two',
                        memberId: '123',
                        submitterHandle: 'coder',
                        type: 'CONTEST_SUBMISSION',
                    }}
                />
            </SWRConfig>,
        )

        expect(await screen.findByRole('dialog', { name: 'Submission History for coder' }))
            .toBeInTheDocument()
        expect(mockedGetHistory)
            .toHaveBeenCalledWith('challenge', '123', 'CONTEST_SUBMISSION')
        expect(await screen.findByRole('columnheader', { name: 'Provisional Score' }))
            .toBeInTheDocument()
        expect(screen.getByRole('columnheader', { name: 'Final Score' }))
            .toBeInTheDocument()
        expect(screen.getByText('31.25'))
            .toBeInTheDocument()
        expect(screen.getByText('50'))
            .toBeInTheDocument()
        expect(screen.queryByRole('link'))
            .not.toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Close submission history' }))
        expect(onClose)
            .toHaveBeenCalledTimes(1)
    })
})
