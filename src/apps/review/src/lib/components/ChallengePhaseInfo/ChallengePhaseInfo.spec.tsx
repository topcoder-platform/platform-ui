/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type { PropsWithChildren, ReactNode } from 'react'
import { render, screen } from '@testing-library/react'

import type { AiReviewConfig, ChallengeInfo } from '../../models'
import { ChallengeDetailContext } from '../../contexts'
import { ChallengePhaseInfo } from './ChallengePhaseInfo'

jest.mock('../../hooks', () => ({
    useRole: () => ({
        actionChallengeRole: 'Submitter',
        myChallengeRoles: ['Submitter'],
    }),
}))
jest.mock('~/config', () => ({ EnvironmentConfig: { TC_DOMAIN: 'topcoder.test' } }), { virtual: true })
jest.mock('~/libs/shared', () => jest.requireActual(
    '../../../../../../libs/shared/lib/utils/ai-review-config.utils',
), { virtual: true })
jest.mock('~/libs/ui', () => ({
    IconOutline: {
        InformationCircleIcon: () => <span />,
    },
    Tooltip: (props: PropsWithChildren<{ content?: ReactNode }>) => (
        <>
            {props.children}
            <span role='tooltip'>{props.content}</span>
        </>
    ),
}), { virtual: true })
jest.mock('../../contexts', () => {
    const React = jest.requireActual('react') as typeof import('react')

    return {
        ChallengeDetailContext: React.createContext({
            isLoadingAiReviewConfig: false,
            resources: [],
        }),
        ReviewAppContext: React.createContext({ loginUserInfo: undefined }),
    }
})
jest.mock('../../utils', () => ({
    formatDurationDate: () => '',
    isMarathonMatchChallenge: () => false,
}))
jest.mock('../ProgressBar', () => ({ ProgressBar: () => undefined }))
jest.mock('../../services', () => ({ fetchWinningsByExternalId: jest.fn() }))

const developmentChallenge = {
    currentPhase: 'Submission',
    currentPhaseEndDate: '2026-09-30T00:00:00Z',
    id: 'challenge-1',
    name: 'Challenge',
    phases: [],
    submissions: [],
    track: { id: 'development', name: 'Development' },
    type: { abbreviation: 'CH', id: 'challenge', name: 'Challenge' },
    typeId: 'challenge',
} as unknown as ChallengeInfo

function renderWithAiReviewConfig(aiReviewConfig?: Partial<AiReviewConfig>): void {
    render(
        <ChallengeDetailContext.Provider
            value={{
                aiReviewConfig,
                isLoadingAiReviewConfig: false,
                resources: [],
            } as any}
        >
            <ChallengePhaseInfo
                challengeInfo={developmentChallenge}
                reviewInProgress={false}
                reviewProgress={0}
                variant='past'
            />
        </ChallengeDetailContext.Provider>,
    )
}

describe('ChallengePhaseInfo', () => {
    it('shows My Role to a submitter', () => {
        const challengeInfo = {
            currentPhase: 'Submission',
            currentPhaseEndDate: '2026-09-30T00:00:00Z',
            id: 'challenge-1',
            name: 'Challenge',
            phases: [],
            submissions: [],
            track: { id: 'design', name: 'Design' },
            type: { abbreviation: 'DS', id: 'design', name: 'Design' },
            typeId: 'design',
        } as ChallengeInfo

        render(
            <ChallengePhaseInfo
                challengeInfo={challengeInfo}
                reviewInProgress={false}
                reviewProgress={0}
            />,
        )

        expect(screen.getByText('My Role'))
            .toBeTruthy()
        expect(screen.getByText('Submitter'))
            .toBeTruthy()
        expect(screen.queryByText('Review Mode'))
            .toBeNull()
    })

    it('explains AI gating review mode and instant review with info tooltips', () => {
        renderWithAiReviewConfig({ instantReview: false, mode: 'AI_GATING' })

        expect(screen.getByText('AI Gating'))
            .toBeTruthy()
        expect(screen.getByText('OFF'))
            .toBeTruthy()
        expect(screen.getByRole('button', { name: 'About Review Mode' }))
            .toBeTruthy()
        expect(screen.getByRole('button', { name: 'About Instant Review' }))
            .toBeTruthy()
        expect(screen.getByText(
            'AI performs a preliminary review, then the Community Review Board evaluates submissions that pass.',
        ))
            .toBeTruthy()
        expect(screen.getByText('You will not receive AI feedback during the submission phase.'))
            .toBeTruthy()
    })

    it('explains AI only review mode with instant review on', () => {
        renderWithAiReviewConfig({ instantReview: true, mode: 'AI_ONLY' })

        expect(screen.getByText('AI only'))
            .toBeTruthy()
        expect(screen.getByText('ON'))
            .toBeTruthy()
        expect(screen.getByText('AI will perform a thorough review based on scorecards.'))
            .toBeTruthy()
        expect(screen.getByText('You will receive AI feedback during the submission phase.'))
            .toBeTruthy()
    })

    it('explains manual review and hides Instant Review without an AI config', () => {
        renderWithAiReviewConfig()

        expect(screen.getByText('Manual'))
            .toBeTruthy()
        expect(screen.getByText('Community Review Board performs a thorough review based on scorecards.'))
            .toBeTruthy()
        expect(screen.queryByText('Instant Review'))
            .toBeNull()
        expect(screen.queryByRole('button', { name: 'About Instant Review' }))
            .toBeNull()
    })
})
