/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { render, screen } from '@testing-library/react'

import type { ChallengeInfo } from '../../models'
import { ChallengePhaseInfo } from './ChallengePhaseInfo'

jest.mock('../../hooks', () => ({
    useRole: () => ({
        actionChallengeRole: 'Submitter',
        myChallengeRoles: ['Submitter'],
    }),
}))
jest.mock('~/config', () => ({ EnvironmentConfig: { TC_DOMAIN: 'topcoder.test' } }), { virtual: true })
jest.mock('~/libs/shared', () => ({
    formatInstantReviewLabel: jest.fn(),
    formatReviewModeLabel: jest.fn(),
    hasAiReviewConfig: () => false,
    isDevelopmentChallengeTrack: () => false,
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

describe('ChallengePhaseInfo', () => {
    it('shows My Role to a submitter', () => {
        const challengeInfo = {
            currentPhase: 'Submission',
            currentPhaseEndDate: '2026-09-30T00:00:00Z',
            id: 'challenge-1',
            name: 'Challenge',
            phases: [],
            submissions: [],
            track: { name: 'Design' },
            type: { abbreviation: 'DS', name: 'Design' },
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
    })
})
