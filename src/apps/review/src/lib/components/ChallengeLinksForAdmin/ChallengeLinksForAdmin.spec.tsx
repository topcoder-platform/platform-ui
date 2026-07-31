/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { render, screen } from '@testing-library/react'

import { ChallengeDetailContext } from '../../contexts'
import type {
    ChallengeDetailContextModel,
    ReviewInfo,
} from '../../models'

import { ChallengeLinksForAdmin } from './ChallengeLinksForAdmin'

jest.mock('../../contexts', () => {
    const React: typeof import('react') = jest.requireActual('react')

    return {
        ChallengeDetailContext: React.createContext({}),
    }
})

jest.mock('../../hooks', () => ({
    useAppNavigate: () => jest.fn(),
}))

jest.mock('../../utils', () => ({
    filterResources: () => [],
    isReviewPhase: () => true,
}))

jest.mock('../ConfirmModal', () => ({
    ConfirmModal: () => <></>,
}))

jest.mock('../DialogContactManager', () => ({
    DialogContactManager: () => <></>,
}))

jest.mock('../DialogPayments', () => ({
    DialogPayments: () => <></>,
}))

const challengeContext = {
    challengeInfo: {
        currentPhase: 'Review',
        currentPhaseObject: {
            id: 'review-phase',
            isOpen: true,
            name: 'Review',
        },
        status: 'ACTIVE',
    },
    myResources: [],
} as unknown as ChallengeDetailContextModel

const reviewInfo = {
    committed: false,
    id: 'review-id',
    phaseId: 'review-phase',
} as ReviewInfo

describe('ChallengeLinksForAdmin', () => {
    it('shows Reopen only after the review has been committed', () => {
        const rendered = render(
            <ChallengeDetailContext.Provider value={challengeContext}>
                <ChallengeLinksForAdmin
                    isSavingReview={false}
                    reviewInfo={reviewInfo}
                    saveReviewInfo={jest.fn()}
                />
            </ChallengeDetailContext.Provider>,
        )

        expect(screen.queryByRole('button', { name: 'Reopen' }))
            .toBeNull()

        rendered.rerender(
            <ChallengeDetailContext.Provider value={challengeContext}>
                <ChallengeLinksForAdmin
                    isSavingReview={false}
                    reviewInfo={{
                        ...reviewInfo,
                        committed: true,
                    }}
                    saveReviewInfo={jest.fn()}
                />
            </ChallengeDetailContext.Provider>,
        )

        expect(screen.getByRole('button', { name: 'Reopen' }))
            .toBeTruthy()
    })
})
